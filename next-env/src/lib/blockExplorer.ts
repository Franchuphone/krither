const blockExplorer =
	process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? "https://sepolia.etherscan.io";

export const txUrl = (hash: string) => `${blockExplorer}/tx/${hash}`;

export const addressUrl = (address: string) =>
	`${blockExplorer}/address/${address}`;
