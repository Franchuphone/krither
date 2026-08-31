import "server-only";
import { serverClient } from "@/lib/serverChain";

const api =
	process.env.NEXT_PUBLIC_ETHERSCAN_API_URL ??
	"https://api.etherscan.io/v2/api";

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

type Body<T> = {
	status?: string;
	message?: string;
	error?: { message: string };
	result: T;
};

/** Per key across every chain; the docs say 5 a second, the wire says 3. */
const MIN_INTERVAL = 400;

const MAX_RETRIES = 4;

const CACHE_LIMIT = 500;

let gate = Promise.resolve(0);

function slot() {
	gate = gate.then(async (previous) => {
		const wait = previous + MIN_INTERVAL - Date.now();
		if (wait > 0) await new Promise((resume) => setTimeout(resume, wait));
		return Date.now();
	});

	return gate;
}

const pause = (ms: number) => new Promise((resume) => setTimeout(resume, ms));

/** Throttling arrives as a 200 with a NOTOK body, never as an HTTP status. */
const throttled = (body: Body<unknown>) =>
	body.status === "0" && /rate limit/i.test(String(body.result));

const empty = (body: Body<unknown>) =>
	body.status === "0" && /no records found/i.test(String(body.message));

/** Next's fetch cache would keep a throttled 200 and serve it for the window. */
const answers = new Map<string, { body: Body<unknown>; at: number }>();

function unwrap<T>(body: Body<T>): T {
	if (body.error) throw new Error(`Etherscan : ${body.error.message}`);
	if (body.status === "0")
		throw new Error(`Etherscan : ${body.message} (${String(body.result)})`);

	return body.result;
}

function remember(key: string, body: Body<unknown>) {
	if (answers.size >= CACHE_LIMIT) {
		const now = Date.now();
		for (const [stale, kept] of answers)
			if (now - kept.at > 60_000) answers.delete(stale);
	}

	answers.set(key, { body, at: Date.now() });
}

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

	const key = url.toString();
	const cached = answers.get(key);
	if (cached && Date.now() - cached.at < revalidate * 1000)
		return unwrap(cached.body as Body<T>);

	for (let attempt = 0; ; attempt++) {
		await slot();

		const response = await fetch(url, { cache: "no-store" });
		if (!response.ok) throw new Error(`Etherscan HTTP ${response.status}`);

		const body = (await response.json()) as Body<T>;

		if (throttled(body)) {
			if (attempt === MAX_RETRIES)
				throw new Error(`Etherscan : ${String(body.result)}`);

			await pause(MIN_INTERVAL * 2 ** attempt);
			continue;
		}

		if (!body.error && (body.status !== "0" || empty(body)))
			remember(key, body);

		return unwrap(body);
	}
}
