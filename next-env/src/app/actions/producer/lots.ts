"use server";

import { getAddress, isAddress, parseEventLogs } from "viem";
import prisma from "@/lib/prisma";
import {
	buildItemMetadata,
	isLotValid,
	MAX_ITEMS,
	normalizeLot,
	validateLot,
	type LotErrors,
	type LotInput,
} from "@/lib/lot";
import { createLotGroup, jsonFile, uploadDirectory } from "@/lib/pinata";
import { registryABI } from "@/lib/registry";
import { registryAddress, serverClient } from "@/lib/serverChain";
import { requireProducer } from "@/lib/session";

export type LotCounts = { total: number; minted: number };

export type DraftState = { ok?: boolean; error?: string; errors?: LotErrors };

export type MintPlan = { cid: string; ref: string; quantities: string[] };

const EMPTY: LotCounts = { total: 0, minted: 0 };

async function producerOf(account: string) {
	if (!isAddress(account)) return null;
	const address = getAddress(account);

	const registryId = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "producerByAddr",
		args: [address],
	});

	return prisma.producer.findFirst({
		where:
			registryId > BigInt(0) ?
				{ OR: [{ registryId }, { account: address }] }
			:	{ account: address },
		select: { id: true, companyName: true },
	});
}

async function currentProducer() {
	const address = await requireProducer();
	return address && producerOf(address);
}

export async function countProducerLots(
	account: string,
): Promise<LotCounts> {
	const producer = await producerOf(account);
	if (!producer) return EMPTY;

	const [total, minted] = await Promise.all([
		prisma.lot.count({ where: { producerId: producer.id } }),
		prisma.lot.count({ where: { producerId: producer.id, status: "MINTED" } }),
	]);

	return { total, minted };
}

export async function listProducerLots() {
	const producer = await currentProducer();
	if (!producer) return [];

	const lots = await prisma.lot.findMany({
		where: { producerId: producer.id },
		orderBy: { createdAt: "desc" },
		include: { items: { orderBy: { index: "asc" } } },
	});

	return lots.map((lot) => ({
		id: lot.id,
		name: lot.name,
		description: lot.description,
		ref: lot.ref.toString(),
		status: lot.status,
		cid: lot.cid,
		idLot: lot.idLot?.toString() ?? null,
		txHash: lot.txHash,
		createdAt: lot.createdAt.toISOString(),
		items: lot.items.map((item) => ({
			index: item.index,
			name: item.name,
			description: item.description,
			quantity: item.quantity,
		})),
	}));
}

export async function createLotDraft(input: LotInput): Promise<DraftState> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const lot = normalizeLot(input);
	const errors = validateLot(lot);
	if (!isLotValid(errors)) return { error: "Lot incomplet", errors };
	if (lot.items.length > MAX_ITEMS)
		return { error: `${MAX_ITEMS} articles maximum` };

	try {
		await prisma.lot.create({
			data: {
				producerId: producer.id,
				name: lot.name,
				description: lot.description || null,
				ref: BigInt(lot.ref),
				items: {
					create: lot.items.map((item, index) => ({
						index,
						name: item.name,
						description: item.description || null,
						quantity: Number(item.quantity),
					})),
				},
			},
		});
	} catch (error) {
		if ((error as { code?: string }).code !== "P2002") throw error;
		return { error: "Cette référence est déjà utilisée" };
	}

	return { ok: true };
}

/** Pins before the tx: mintLot takes the cid, and it is frozen from then on. */
export async function pinLotDraft(
	lotId: string,
): Promise<{ plan?: MintPlan; error?: string }> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const lot = await prisma.lot.findFirst({
		where: { id: lotId, producerId: producer.id },
		include: { items: { orderBy: { index: "asc" } } },
	});
	if (!lot) return { error: "Lot introuvable" };
	if (lot.status !== "DRAFT") return { error: "Lot déjà ancré" };
	if (lot.items.length === 0) return { error: "Lot sans article" };

	const quantities = lot.items.map((item) => item.quantity.toString());

	if (lot.cid) {
		return { plan: { cid: lot.cid, ref: lot.ref.toString(), quantities } };
	}

	const group = lot.groupId ?? (await createLotGroup(`Krither-${lot.id}`));

	const cid = await uploadDirectory(
		lot.items.map((item) =>
			jsonFile(
				`${item.index}.json`,
				buildItemMetadata(lot, item, producer.companyName),
			),
		),
		group,
	);

	await prisma.lot.update({
		where: { id: lot.id },
		data: { cid, groupId: group },
	});

	return { plan: { cid, ref: lot.ref.toString(), quantities } };
}

/** Reads the mined receipt rather than trusting the client for idLot. */
export async function recordLotMint(
	lotId: string,
	txHash: `0x${string}`,
): Promise<{ ok?: boolean; error?: string }> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const lot = await prisma.lot.findFirst({
		where: { id: lotId, producerId: producer.id },
		select: { id: true, ref: true, status: true },
	});
	if (!lot) return { error: "Lot introuvable" };
	if (lot.status !== "DRAFT") return { error: "Lot déjà ancré" };

	const receipt = await serverClient.getTransactionReceipt({ hash: txHash });
	if (receipt.status !== "success") return { error: "Transaction échouée" };

	const [event] = parseEventLogs({
		abi: registryABI,
		eventName: "LotCreated",
		logs: receipt.logs,
	});
	if (!event) return { error: "Aucun lot créé par cette transaction" };

	const { idLot, ref } = event.args as { idLot: bigint; ref: bigint };
	if (ref !== lot.ref) return { error: "Transaction liée à un autre lot" };

	await prisma.lot.update({
		where: { id: lot.id },
		data: { status: "MINTED", idLot, txHash },
	});

	return { ok: true };
}
