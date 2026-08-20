"use server";

import { cookies, headers } from "next/headers";
import { getAddress, isAddress } from "viem";
import { generateSiweNonce, parseSiweMessage } from "viem/siwe";
import {
	cookieOptions,
	NONCE_COOKIE,
	NONCE_TTL_SECONDS,
	SESSION_COOKIE,
	SESSION_TTL_SECONDS,
	seal,
	sessionAddress,
} from "@/lib/session";
import { serverClient } from "@/lib/serverChain";

export type SignInState = { ok?: boolean; error?: string };

async function requestDomain() {
	const host = (await headers()).get("host");
	if (!host) throw new Error("Missing host header");
	return host;
}

export async function currentSessionAddress() {
	return sessionAddress();
}

export async function startSignIn() {
	const nonce = generateSiweNonce();

	(await cookies()).set(NONCE_COOKIE, nonce, {
		...cookieOptions,
		maxAge: NONCE_TTL_SECONDS,
	});

	return { nonce, domain: await requestDomain() };
}

/** Establishes who the caller is; each action then gates on the role it needs. */
export async function completeSignIn(
	message: string,
	signature: `0x${string}`,
): Promise<SignInState> {
	const jar = await cookies();
	const nonce = jar.get(NONCE_COOKIE)?.value;
	if (!nonce) return { error: "Session de signature expirée" };

	jar.delete(NONCE_COOKIE);

	const { address } = parseSiweMessage(message);
	if (!address || !isAddress(address)) return { error: "Signature invalide" };

	const valid = await serverClient.verifySiweMessage({
		message,
		signature,
		address,
		nonce,
		domain: await requestDomain(),
	});
	if (!valid) return { error: "Signature invalide" };

	jar.set(SESSION_COOKIE, seal(getAddress(address)), {
		...cookieOptions,
		maxAge: SESSION_TTL_SECONDS,
	});

	return { ok: true };
}

export async function endSession() {
	(await cookies()).delete(SESSION_COOKIE);
}
