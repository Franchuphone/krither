"use server";

import { getAddress, isAddress } from "viem";
import prisma from "@/lib/prisma";
import {
	normalizeSubmission,
	PRODUCER_FIELD_NAMES,
	validateSubmission,
	type ProducerFieldName,
	type ProducerRequest,
	type ProducerSubmission,
} from "@/lib/producerRegistration";

export type SubmitState = {
	ok?: boolean;
	error?: string;
	errors?: Partial<Record<ProducerFieldName, string>>;
};

export async function getProducerRequest(
	account: string,
): Promise<ProducerRequest | null> {
	if (!isAddress(account)) return null;

	const producer = await prisma.producer.findUnique({
		where: { account: getAddress(account) },
		select: { status: true, companyName: true, createdAt: true },
	});

	return (
		producer && { ...producer, createdAt: producer.createdAt.toISOString() }
	);
}

export async function submitProducerRequest(
	_state: SubmitState,
	formData: FormData,
): Promise<SubmitState> {
	const account = String(formData.get("account") ?? "");
	if (!isAddress(account)) return { error: "Compte invalide" };

	const submission = normalizeSubmission(
		Object.fromEntries(
			PRODUCER_FIELD_NAMES.map((name) => [
				name,
				String(formData.get(name) ?? ""),
			]),
		) as ProducerSubmission,
	);

	const errors = validateSubmission(submission);
	if (Object.keys(errors).length > 0) {
		return { error: "Dossier incomplet", errors };
	}

	const accredited = await prisma.producer.findFirst({
		where: { siret: submission.siret, status: "APPROVED" },
		select: { id: true },
	});
	if (accredited)
		return {
			error: "Ce numéro SIRET a déjà été utilisé sur notre plateforme",
		};

	try {
		await prisma.producer.create({
			data: { account: getAddress(account), ...submission },
		});
	} catch (error) {
		if ((error as { code?: string }).code !== "P2002") throw error;
		return { error: "Une demande existe déjà pour ce compte" };
	}

	return { ok: true };
}
