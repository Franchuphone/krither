import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAddress, isAddress } from "viem";
import { registryABI } from "@/lib/registry";
import { DEFAULT_ADMIN_ROLE } from "@/lib/roles";
import { registryAddress, serverClient } from "@/lib/serverChain";

export const SESSION_COOKIE = "krither_admin";
export const NONCE_COOKIE = "krither_admin_nonce";

export const NONCE_TTL_SECONDS = 5 * 60;
export const SESSION_TTL_SECONDS = 60 * 60;

const secret = process.env.ADMIN_SESSION_SECRET;

function sign(payload: string) {
	if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
	return createHmac("sha256", secret).update(payload).digest("base64url");
}

function matches(a: string, b: string) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && timingSafeEqual(left, right);
}

export function seal(address: `0x${string}`) {
	const payload = `${address}.${Date.now() + SESSION_TTL_SECONDS * 1000}`;
	return `${payload}.${sign(payload)}`;
}

function unseal(token: string) {
	const [address, expiry, signature] = token.split(".");
	if (!address || !expiry || !signature) return null;
	if (!matches(sign(`${address}.${expiry}`), signature)) return null;
	if (Number(expiry) < Date.now()) return null;
	return isAddress(address) ? getAddress(address) : null;
}

export const cookieOptions = {
	httpOnly: true,
	sameSite: "strict",
	secure: process.env.NODE_ENV === "production",
	path: "/",
} as const;

export async function adminAddress() {
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	return token ? unseal(token) : null;
}

/**
 * The role is re-read on every call, not trusted from the cookie: a revocation
 * has to take effect before the session would have expired.
 */
export async function requireAdmin() {
	const address = await adminAddress();
	if (!address) return null;

	const isAdmin = await serverClient.readContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "hasRole",
		args: [DEFAULT_ADMIN_ROLE, address],
	});

	return isAdmin ? address : null;
}
