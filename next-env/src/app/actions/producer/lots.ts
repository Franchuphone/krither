"use server";

import { getAddress, isAddress } from "viem";
import prisma from "@/lib/prisma";
import { registryABI } from "@/lib/registry";
import { registryAddress, serverClient } from "@/lib/serverChain";

export type LotCounts = { total: number; minted: number };

const EMPTY: LotCounts = { total: 0, minted: 0 };

/**
 * Resolves through the on-chain producer id rather than the address: a wallet
 * rotated by reassignProducer keeps the same id, and its lots with it.
 */
export async function countProducerLots(account: string): Promise<LotCounts> {
	if (!isAddress(account)) return EMPTY;

	const registryId = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "producerByAddr",
		args: [getAddress(account)],
	});

	const producer = await prisma.producer.findFirst({
		where:
			registryId > BigInt(0) ?
				{ OR: [{ registryId }, { account: getAddress(account) }] }
			:	{ account: getAddress(account) },
		select: { id: true },
	});
	if (!producer) return EMPTY;

	const [total, minted] = await Promise.all([
		prisma.lot.count({ where: { producerId: producer.id } }),
		prisma.lot.count({ where: { producerId: producer.id, status: "MINTED" } }),
	]);

	return { total, minted };
}
