import "server-only";
import {
	decodeEventLog,
	encodeEventTopics,
	parseEventLogs,
	zeroAddress,
} from "viem";
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

export type LifecycleStep = {
	kind: "step";
	txHash: `0x${string}`;
	recordedAt: string;
	holder: `0x${string}`;
	cid: string;
	metadata: ItemMetadata | null;
};

export type LifecycleTransfer = {
	kind: "transfer";
	txHash: `0x${string}`;
	recordedAt: string;
	from: `0x${string}`;
	to: `0x${string}`;
	quantity: string;
};

export type LifecycleEntry = LifecycleStep | LifecycleTransfer;

export type VerifiedLot = {
	producerId: string;
	account: `0x${string}`;
	accredited: boolean;
	idLot: string;
	ref: string;
	cid: string;
	lot: ItemMetadata | null;
	items: (ItemMetadata | null)[];
	lifecycle: LifecycleEntry[];
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

/** A step is pinned on its own, so its cid resolves to the json itself. */
async function stepMetadata(cid: string) {
	try {
		const response = await fetch(ipfsUrl(cid), { next: { revalidate: 3600 } });
		return response.ok ? ((await response.json()) as ItemMetadata) : null;
	} catch {
		return null;
	}
}

/**
 * Lifecycle steps live in events only, never in storage: every LifecycleChanged
 * on the lot's own token, oldest first. A read failure yields no history rather
 * than failing the whole verification.
 */
async function verifySteps(idLot: bigint): Promise<LifecycleStep[]> {
	try {
		const [topic0, , topic2] = encodeEventTopics({
			abi: registryABI,
			eventName: "LifecycleChanged",
			args: { idLot },
		});

		const logs = await etherscan<EtherscanLog[]>({
			module: "logs",
			action: "getLogs",
			address: registryAddress,
			fromBlock: deployedBlock,
			toBlock: "latest",
			topic0: String(topic0),
			topic0_2_opr: "and",
			topic2: String(topic2),
			page: "1",
			offset: "1000",
		});

		return await Promise.all(
			logs.map(async (log) => {
				const { args } = decodeEventLog({
					abi: registryABI,
					eventName: "LifecycleChanged",
					topics: log.topics,
					data: log.data,
				});

				return {
					kind: "step" as const,
					txHash: log.transactionHash,
					recordedAt: new Date(Number(args.changedAt) * 1000).toISOString(),
					holder: args.owner,
					cid: args.cid,
					metadata: await stepMetadata(args.cid),
				};
			}),
		);
	} catch (cause) {
		// A lot without a single step is the norm, and Etherscan reports it as an error.
		if (!String(cause).includes("No records found")) console.error(cause);
		return [];
	}
}

/**
 * `TransferSingle` leaves the token id out of its topics, so the lot's own
 * transfers can only be sorted out of the contract's transfers in memory.
 * The mint itself is a `TransferBatch` and never shows up here.
 */
async function verifyTransfers(idItem: bigint): Promise<LifecycleTransfer[]> {
	try {
		const [topic0] = encodeEventTopics({
			abi: registryABI,
			eventName: "TransferSingle",
		});

		const logs = await etherscan<EtherscanLog[]>({
			module: "logs",
			action: "getLogs",
			address: registryAddress,
			fromBlock: deployedBlock,
			toBlock: "latest",
			topic0: String(topic0),
			page: "1",
			offset: "1000",
		});

		return logs.flatMap((log) => {
			const { args } = decodeEventLog({
				abi: registryABI,
				eventName: "TransferSingle",
				topics: log.topics,
				data: log.data,
			});
			if (args.id !== idItem || args.from === zeroAddress) return [];

			return [
				{
					kind: "transfer" as const,
					txHash: log.transactionHash,
					recordedAt: new Date(Number(log.timeStamp) * 1000).toISOString(),
					from: args.from,
					to: args.to,
					quantity: args.value.toString(),
				},
			];
		});
	} catch (cause) {
		// A lot that never changed hands is the norm, and Etherscan calls it an error.
		if (!String(cause).includes("No records found")) console.error(cause);
		return [];
	}
}

/** One timeline: steps and changes of hands, oldest first. */
async function verifyLifecycle(idLot: bigint): Promise<LifecycleEntry[]> {
	const [steps, transfers] = await Promise.all([
		verifySteps(idLot),
		verifyTransfers(idLot << BigInt(128)),
	]);

	return [...steps, ...transfers].sort((a, b) =>
		a.recordedAt.localeCompare(b.recordedAt),
	);
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

	const [documents, lifecycle, verifiedTx] = await Promise.all([
		Promise.all(
			Array.from({ length: Number(itemCount) }, (_, index) =>
				metadata(cid, index),
			),
		),
		verifyLifecycle(idLot),
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
		lifecycle,
		verifiedTx,
	};
}
