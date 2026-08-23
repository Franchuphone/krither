"use server";

import { toString } from "qrcode";
import {
	BaseError,
	ContractFunctionRevertedError,
	getAddress,
	isAddress,
	parseEventLogs,
} from "viem";
import prisma from "@/lib/prisma";
import {
	buildItemMetadata,
	buildLotMetadata,
	isLotValid,
	MAX_ITEMS,
	MAX_LOT_DOCUMENTS,
	normalizeLot,
	validateLot,
	type LotErrors,
	type LotInput,
} from "@/lib/lot";
import { jsonFile, uploadDirectory, uploadDocument } from "@/lib/pinata";
import { registryABI } from "@/lib/registry";
import { registryAddress, serverClient } from "@/lib/serverChain";
import { requireProducer } from "@/lib/session";

export type LotCounts = { total: number; minted: number };

export type DraftState = {
	ok?: boolean;
	error?: string;
	errors?: LotErrors;
	lotId?: string;
	itemIds?: string[];
};

export type MintPlan = { cid: string; ref: string; quantities: string[] };

export type LotDocumentView = ReturnType<typeof documentView>;

const EMPTY: LotCounts = { total: 0, minted: 0 };

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

/** `image/jpg` is not standard, but old Windows tooling still sends it. */
const DOCUMENT_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];

const documentView = (document: {
	id: string;
	name: string;
	mimeType: string;
	size: number;
	cid: string;
}) => ({
	id: document.id,
	name: document.name,
	mimeType: document.mimeType,
	size: document.size,
	cid: document.cid,
});

async function producerOf(account: string) {
	if (!isAddress(account)) return null;
	const address = getAddress(account);

	const registryId = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "producerByAddr",
		args: [address],
	});

	const producer = await prisma.producer.findFirst({
		where:
			registryId > BigInt(0) ?
				{ OR: [{ registryId }, { account: address }] }
			:	{ account: address },
		select: { id: true, companyName: true, groupId: true },
	});

	return producer && { ...producer, account: address, registryId };
}

async function currentProducer() {
	const address = await requireProducer();
	return address && producerOf(address);
}

export async function countProducerLots(account: string): Promise<LotCounts> {
	const producer = await producerOf(account);
	if (!producer) return EMPTY;

	const [total, minted] = await Promise.all([
		prisma.lot.count({ where: { producerId: producer.id } }),
		prisma.lot.count({
			where: { producerId: producer.id, status: "MINTED" },
		}),
	]);

	return { total, minted };
}

export async function listProducerLots() {
	const producer = await currentProducer();
	if (!producer) return [];

	const lots = await prisma.lot.findMany({
		where: { producerId: producer.id },
		orderBy: { createdAt: "desc" },
		include: {
			documents: { where: { itemId: null }, orderBy: { createdAt: "asc" } },
			items: {
				orderBy: { index: "asc" },
				include: { document: true },
			},
		},
	});

	for (const lot of lots) {
		if (lot.status !== "DRAFT") continue;

		const idLot = await reconcileMinted(lot, producer.account);
		if (idLot > BigInt(0)) {
			lot.status = "MINTED";
			lot.idLot = idLot;
		}
	}

	return lots.map((lot) => ({
		id: lot.id,
		name: lot.name,
		description: lot.description,
		ref: lot.ref.toString(),
		status: lot.status,
		zone: lot.zone,
		producedAt: lot.producedAt?.toISOString() ?? null,
		cid: lot.cid,
		idLot: lot.idLot?.toString() ?? null,
		txHash: lot.txHash,
		createdAt: lot.createdAt.toISOString(),
		documents: lot.documents.map(documentView),
		items: lot.items.map((item) => ({
			id: item.id,
			index: item.index,
			name: item.name,
			description: item.description,
			quantity: item.quantity,
			document: item.document && documentView(item.document),
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
		const created = await prisma.lot.create({
			data: {
				producerId: producer.id,
				name: lot.name,
				description: lot.description || null,
				ref: BigInt(lot.ref),
				zone: lot.zone,
				producedAt: new Date(lot.producedAt),
				items: {
					create: lot.items.map((item, index) => ({
						index: index + 1,
						name: item.name,
						description: item.description || null,
						quantity: Number(item.quantity),
					})),
				},
			},
			select: {
				id: true,
				items: { orderBy: { index: "asc" }, select: { id: true } },
			},
		});

		return {
			ok: true,
			lotId: created.id,
			itemIds: created.items.map((item) => item.id),
		};
	} catch (error) {
		if ((error as { code?: string }).code !== "P2002") throw error;
		return { error: "Ce numéro de lot est déjà utilisé" };
	}
}

export async function depositLotDocument(
	formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const file = formData.get("file");
	const lotId = String(formData.get("lotId") ?? "");
	const itemId = String(formData.get("itemId") ?? "") || null;

	if (!(file instanceof File) || file.size === 0)
		return { error: "Aucun document" };
	if (file.size > MAX_DOCUMENT_SIZE) return { error: "10 Mo maximum" };
	if (!DOCUMENT_TYPES.includes(file.type))
		return { error: "Format accepté : PDF, JPEG, PNG ou WEBP" };

	if (!producer.groupId) return { error: "Espace de stockage introuvable" };

	const lot = await prisma.lot.findFirst({
		where: { id: lotId, producerId: producer.id },
		select: { id: true, ref: true, status: true, cid: true },
	});
	if (!lot) return { error: "Lot introuvable" };
	if (lot.status !== "DRAFT") return { error: "Lot déjà ancré" };
	if (lot.cid) return { error: "Métadonnées déjà publiées" };

	if (itemId) {
		const item = await prisma.lotItem.findFirst({
			where: { id: itemId, lotId: lot.id },
			include: { document: true },
		});
		if (!item) return { error: "Article introuvable" };
		if (item.document) return { error: "Cet article a déjà un document" };
	} else {
		const deposited = await prisma.lotDocument.count({
			where: { lotId: lot.id, itemId: null },
		});
		if (deposited >= MAX_LOT_DOCUMENTS)
			return { error: `${MAX_LOT_DOCUMENTS} documents maximum par lot` };
	}

	try {
		const { cid, pinataId } = await uploadDocument(
			file,
			file.name,
			producer.groupId,
		);

		await prisma.lotDocument.create({
			data: {
				lotId: lot.id,
				itemId,
				name: file.name,
				mimeType: file.type,
				size: file.size,
				cid,
				pinataId,
			},
		});
	} catch (cause) {
		console.error(cause);
		return { error: "Dépôt du document impossible" };
	}

	return { ok: true };
}

export async function removeLotDocument(
	documentId: string,
): Promise<{ ok?: boolean; error?: string }> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const document = await prisma.lotDocument.findFirst({
		where: { id: documentId, lot: { producerId: producer.id } },
		select: {
			id: true,
			pinataId: true,
			lot: { select: { status: true, cid: true } },
		},
	});
	if (!document) return { error: "Document introuvable" };
	if (document.lot.status !== "DRAFT") return { error: "Lot déjà ancré" };
	if (document.lot.cid) return { error: "Métadonnées déjà publiées" };

	// Detaches from the lot only: Pinata dedupes, so the same record may already
	// back another lot. Unpinning belongs to the producer's documents tab.
	await prisma.lotDocument.delete({ where: { id: document.id } });

	return { ok: true };
}

const lotLabel = (registryId: bigint, ref: bigint) =>
	`Krither-p${registryId}-${ref}`;


const REVERTS: Record<string, string> = {
	LotAlreadyExists: "Ce lot est déjà ancré sur la blockchain",
	EnforcedPause: "La plateforme est en pause",
	AccessControlUnauthorizedAccount: "Statut producteur requis",
};

/** The wallet strips revert data, so the reason is only readable from here. */
function revertMessage(cause: unknown) {
	const reverted =
		cause instanceof BaseError ?
			cause.walk((error) => error instanceof ContractFunctionRevertedError)
		:	null;

	if (!(reverted instanceof ContractFunctionRevertedError)) {
		return "Ancrage impossible";
	}

	const name = reverted.data?.errorName ?? "";

	return REVERTS[name] ?? `Ancrage refusé par le contrat (${name})`;
}

/**
 * Heals a lot minted on chain whose tx was never recorded: without this the
 * draft keeps offering an anchor that can only revert with LotAlreadyExists.
 */
async function reconcileMinted(
	lot: { id: string; ref: bigint },
	account: `0x${string}`,
) {
	const idLot = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "lotIds",
		args: [account, lot.ref],
	});

	if (idLot > BigInt(0)) {
		await prisma.lot.update({
			where: { id: lot.id },
			data: { status: "MINTED", idLot },
		});
	}

	return idLot;
}

/** Pins before the tx: mintLot takes the cid, and it is frozen from then on. */
export async function pinLotDraft(
	lotId: string,
): Promise<{ plan?: MintPlan; error?: string }> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const lot = await prisma.lot.findFirst({
		where: { id: lotId, producerId: producer.id },
		include: {
			documents: { where: { itemId: null }, orderBy: { createdAt: "asc" } },
			items: {
				orderBy: { index: "asc" },
				include: { document: true },
			},
		},
	});
	if (!lot) return { error: "Lot introuvable" };
	if (lot.status !== "DRAFT") return { error: "Lot déjà ancré" };
	if (lot.items.length === 0) return { error: "Lot sans article" };

	if ((await reconcileMinted(lot, producer.account)) > BigInt(0)) {
		return { error: REVERTS.LotAlreadyExists };
	}

	const units = lot.items.reduce((total, item) => total + item.quantity, 0);
	const quantities = [units, ...lot.items.map((item) => item.quantity)].map(
		String,
	);

	let cid = lot.cid;

	if (!cid) {
		if (!producer.groupId) return { error: "Espace de stockage introuvable" };

		try {
			cid = await uploadDirectory(
				[
					jsonFile(
						"0.json",
						buildLotMetadata(lot, producer.companyName, units),
					),
					...lot.items.map((item) =>
						jsonFile(
							`${item.index}.json`,
							buildItemMetadata(lot, item, producer.companyName),
						),
					),
				],
				`${lotLabel(producer.registryId, lot.ref)}-JSON`,
				producer.groupId,
			);
		} catch (cause) {
			console.error(cause);
			return { error: "Publication des métadonnées impossible" };
		}

		await prisma.lot.update({
			where: { id: lot.id },
			data: { cid },
		});
	}

	// Dry run against the real sender: the wallet would only report "reverted".
	try {
		await serverClient.simulateContract({
			address: registryAddress,
			abi: registryABI,
			functionName: "mintLot",
			args: [quantities.map(BigInt), cid, lot.ref],
			account: producer.account,
		});
	} catch (cause) {
		console.error(cause);
		return { error: revertMessage(cause) };
	}

	return { plan: { cid, ref: lot.ref.toString(), quantities } };
}

export async function lotQrCode(
	lotId: string,
): Promise<{ url?: string; svg?: string; error?: string }> {
	const producer = await currentProducer();
	if (!producer) return { error: "Accès refusé" };

	const lot = await prisma.lot.findFirst({
		where: { id: lotId, producerId: producer.id },
		select: { ref: true, status: true },
	});
	if (!lot) return { error: "Lot introuvable" };
	if (lot.status !== "MINTED") return { error: "Lot pas encore ancré" };

	const url = `${appUrl}/verify/${producer.registryId}/${lot.ref}`;

	return { url, svg: await toString(url, { type: "svg", margin: 1 }) };
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
