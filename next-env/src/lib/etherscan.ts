import "server-only";
import { serverClient } from "@/lib/serverChain";

const api =
	process.env.NEXT_PUBLIC_ETHERSCAN_API_URL ?? "https://api.etherscan.io/v2/api";

export type EtherscanLog = {
	address: `0x${string}`;
	topics: [`0x${string}`, ...`0x${string}`[]];
	data: `0x${string}`;
	blockNumber: `0x${string}`;
	blockHash: `0x${string}`;
	removed: boolean;
	timeStamp: `0x${string}`;
	logIndex: `0x${string}`;
	transactionHash: `0x${string}`;
	transactionIndex: `0x${string}`;
};

export type EtherscanReceipt = {
	status: `0x${string}`;
	from: `0x${string}`;
	to: `0x${string}` | null;
	blockNumber: `0x${string}`;
	logs: EtherscanLog[];
};

/** One v2 endpoint for every chain: the id selects the network. */
export async function etherscan<T>(
	params: Record<string, string>,
	revalidate = 60,
): Promise<T> {
	const url = new URL(api);
	url.search = new URLSearchParams({
		chainid: String(serverClient.chain.id),
		apikey: process.env.ETHERSCAN_API_KEY ?? "",
		...params,
	}).toString();

	const response = await fetch(url, { next: { revalidate } });
	if (!response.ok) throw new Error(`Etherscan HTTP ${response.status}`);

	const body = (await response.json()) as {
		status?: string;
		message?: string;
		error?: { message: string };
		result: T;
	};

	if (body.error) throw new Error(`Etherscan : ${body.error.message}`);
	if (body.status === "0")
		throw new Error(`Etherscan : ${body.message} (${String(body.result)})`);

	return body.result;
}
