"use server";

import { getAddress } from "viem";
import { requireAdmin } from "@/lib/session";
import { createGroup } from "@/lib/pinata";
import prisma from "@/lib/prisma";
import type { ProducerDossier } from "@/lib/producerRegistration";
import { registryABI } from "@/lib/registry";
import { PRODUCER_ROLE } from "@/lib/roles";
import { registryAddress, serverClient } from "@/lib/serverChain";

export type ReviewState = { ok?: boolean; error?: string };

export async function listProducerRequests(): Promise<ProducerDossier[]> {
	if (!(await requireAdmin())) return [];

	const producers = await prisma.producer.findMany({
		where: { status: "PENDING" },
		orderBy: { createdAt: "asc" },
		omit: { registryId: true, updatedAt: true },
	});

	return producers.map((producer) => ({
		...producer,
		account: producer.account as `0x${string}`,
		createdAt: producer.createdAt.toISOString(),
	}));
}

/** Records what the chain already says, so no dossier is approved without its grant tx. */
export async function approveProducer(id: string): Promise<ReviewState> {
	if (!(await requireAdmin())) return { error: "Accès refusé" };

	const producer = await prisma.producer.findUnique({
		where: { id },
		select: { account: true, status: true },
	});
	if (!producer) return { error: "Dossier introuvable" };
	if (producer.status !== "PENDING") return { error: "Dossier déjà traité" };

	const account = getAddress(producer.account);

	const granted = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [PRODUCER_ROLE, account],
	});
	if (!granted) return { error: "Le statut n'a pas encore été attribué" };

	const registryId = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "producerByAddr",
		args: [account],
	});

	// Accredited implies the group exists: on failure the dossier stays PENDING
	// and the admin retries, rather than leaving a producer with nowhere to pin.
	let groupId: string;
	try {
		groupId = await createGroup(`Krither-p${registryId}`);
	} catch (cause) {
		console.error(cause);
		return { error: "Espace de stockage indisponible, réessayez" };
	}

	await prisma.producer.update({
		where: { id },
		data: { status: "APPROVED", registryId, groupId },
	});

	return { ok: true };
}

export async function rejectProducer(id: string): Promise<ReviewState> {
	if (!(await requireAdmin())) return { error: "Accès refusé" };

	const { count } = await prisma.producer.updateMany({
		where: { id, status: "PENDING" },
		data: { status: "REJECTED" },
	});

	return count === 1 ? { ok: true } : { error: "Dossier déjà traité" };
}
