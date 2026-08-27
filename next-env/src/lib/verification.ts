import "server-only";
import { encodeEventTopics, parseEventLogs, zeroAddress } from "viem";
import {
	etherscan,
	type EtherscanLog,
	type EtherscanReceipt,
} from "@/lib/etherscan";
import type { ItemMetadata } from "@/lib/lot";
import prisma from "@/lib/prisma";
import { registryABI } from "@/lib/registry";
import { PRODUCER_ROLE } from "@/lib/roles";
import { registryAddress, serverClient } from "@/lib/serverChain";

const gateway = process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud";

const publicGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io";

const deployedBlock = process.env.NEXT_PUBLIC_REGISTRY_DEPLOYED_BLOCK ?? "0";

export const ipfsUrl = (cid: string) => `${gateway}/ipfs/${cid}`;

export const publicIpfsUrl = (cid: string) => `${publicGateway}/ipfs/${cid}`;

export type TxEvent = {
	name: string;
	args: { name: string; value: string }[];
};

/** Only what a client component may read back: strings, never a bigint. */
export type VerifiedTxLot = {
	txHash: `0x${string}`;
	contract: `0x${string}`;
	minedAt: string;
	events: TxEvent[];
};

export type VerifiedLot = {
	producerId: string;
	account: `0x${string}`;
	accredited: boolean;
	idLot: string;
	ref: string;
	cid: string;
	lot: ItemMetadata | null;
	items: (ItemMetadata | null)[];
	verifiedTx: VerifiedTxLot | null;
};

export type VerifiedProducer = {
	producerId: string;
	accredited: boolean;
	companyName: string | null;
};

export async function verifyProducer(
	producerId: string,
): Promise<VerifiedProducer | null> {
	if (!/^\d+$/.test(producerId)) return null;

	const account = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "producerById",
		args: [BigInt(producerId)],
	});
	if (account === zeroAddress) return null;

	const [accredited, producer] = await Promise.all([
		serverClient.readContract({
			address: registryAddress,
			abi: registryABI,
			functionName: "hasRole",
			args: [PRODUCER_ROLE, account],
		}),
		prisma.producer.findUnique({
			where: { registryId: BigInt(producerId) },
			select: { companyName: true },
		}),
	]);

	return {
		producerId,
		accredited,
		companyName: producer?.companyName ?? null,
	};
}

/** A document that fails to load is reported as such, not as a bad lot. */
async function metadata(cid: string, index: number) {
	try {
		const response = await fetch(`${ipfsUrl(cid)}/${index}.json`, {
			next: { revalidate: 3600 },
		});
		return response.ok ? ((await response.json()) as ItemMetadata) : null;
	} catch {
		return null;
	}
}

const readable = (value: unknown): string =>
	Array.isArray(value) ? value.map(readable).join(", ")
	: typeof value === "bigint" ? value.toString()
	: String(value);

/**
 * The LotCreated log names the anchoring transaction; its receipt names the
 * rest. An existing lot always has that log, so a miss is a read failure, not
 * an absence: it is logged and reported to the page as unavailable proof.
 */
async function verifyTxLot(idLot: bigint): Promise<VerifiedTxLot | null> {
	try {
		const [topic0, topic1] = encodeEventTopics({
			abi: registryABI,
			eventName: "LotCreated",
			args: { idLot },
		});

		const [created] = await etherscan<EtherscanLog[]>({
			module: "logs",
			action: "getLogs",
			address: registryAddress,
			fromBlock: deployedBlock,
			toBlock: "latest",
			topic0: String(topic0),
			topic0_1_opr: "and",
			topic1: String(topic1),
			page: "1",
			offset: "1",
		});
		if (!created) throw new Error(`Aucun log LotCreated pour le lot ${idLot}`);

		const receipt = await etherscan<EtherscanReceipt>({
			module: "proxy",
			action: "eth_getTransactionReceipt",
			txhash: created.transactionHash,
		});
		if (receipt.status !== "0x1")
			throw new Error(`Transaction ${created.transactionHash} échouée`);

		const events = parseEventLogs({
			abi: registryABI,
			logs: receipt.logs.filter(
				(log) => log.address.toLowerCase() === registryAddress.toLowerCase(),
			),
		});

		return {
			txHash: created.transactionHash,
			contract: registryAddress,
			minedAt: new Date(Number(created.timeStamp) * 1000).toISOString(),
			events: events.map((event) => ({
				name: event.eventName,
				args: Object.entries(event.args ?? {}).map(([name, value]) => ({
					name,
					value: readable(value),
				})),
			})),
		};
	} catch (cause) {
		console.error(cause);
		return null;
	}
}

/** Chain and IPFS only: a database row proves nothing about a lot. */
export async function verifyLot(
	producerId: string,
	ref: string,
): Promise<VerifiedLot | null> {
	if (!/^\d+$/.test(producerId) || !/^\d+$/.test(ref)) return null;

	const account = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "producerById",
		args: [BigInt(producerId)],
	});
	if (account === zeroAddress) return null;

	const idLot = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "lotIds",
		args: [BigInt(producerId), BigInt(ref)],
	});
	if (idLot === BigInt(0)) return null;

	const [[, itemCount, cid], accredited] = await Promise.all([
		serverClient.readContract({
			address: registryAddress,
			abi: registryABI,
			functionName: "lots",
			args: [idLot],
		}),
		serverClient.readContract({
			address: registryAddress,
			abi: registryABI,
			functionName: "hasRole",
			args: [PRODUCER_ROLE, account],
		}),
	]);

	const [documents, verifiedTx] = await Promise.all([
		Promise.all(
			Array.from({ length: Number(itemCount) }, (_, index) =>
				metadata(cid, index),
			),
		),
		verifyTxLot(idLot),
	]);

	const [lot, ...items] = documents;

	return {
		producerId,
		account,
		accredited,
		idLot: idLot.toString(),
		ref,
		cid,
		lot,
		items,
		verifiedTx,
	};
}
