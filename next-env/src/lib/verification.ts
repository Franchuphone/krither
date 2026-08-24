import "server-only";
import { zeroAddress } from "viem";
import type { ItemMetadata } from "@/lib/lot";
import prisma from "@/lib/prisma";
import { registryABI } from "@/lib/registry";
import { PRODUCER_ROLE } from "@/lib/roles";
import { registryAddress, serverClient } from "@/lib/serverChain";

const gateway = process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud";

export const ipfsUrl = (cid: string) => `${gateway}/ipfs/${cid}`;

export type VerifiedLot = {
	producerId: string;
	account: `0x${string}`;
	accredited: boolean;
	idLot: string;
	ref: string;
	cid: string;
	lot: ItemMetadata | null;
	items: (ItemMetadata | null)[];
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
		args: [account, BigInt(ref)],
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

	const documents = await Promise.all(
		Array.from({ length: Number(itemCount) }, (_, index) =>
			metadata(cid, index),
		),
	);

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
	};
}
