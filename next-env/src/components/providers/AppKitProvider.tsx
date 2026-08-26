"use client";
import { type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

// Wallet-metadata origin: NEXT_PUBLIC_APP_URL, else the browser origin, else localhost.
const appUrl = (
	process.env.NEXT_PUBLIC_APP_URL ||
	(typeof window !== "undefined" ?
		window.location.origin
	:	"http://localhost:3000")
).replace(/\/$/, "");

// Our own proxy, so the node's key stays server-side. Relative in the browser;
// the server has no origin to resolve it against, so it needs the full URL.
const RPC = typeof window === "undefined" ? `${appUrl}/api/rpc` : "/api/rpc";

const wagmiAdapter = new WagmiAdapter({
	networks: [sepolia],
	projectId,
	ssr: true,
	transports: {
		[sepolia.id]: http(RPC),
	},
});

// Init AppKit once at module scope; its modal is a global web component on <body>.
createAppKit({
	adapters: [wagmiAdapter],
	networks: [sepolia],
	projectId,
	// enableWallets: false,
	coinbasePreference: "smartWalletOnly",
	metadata: {
		name: "Krither",
		description:
			"Blockchain supply-chain tracking for small and mid-sized producers.",
		url: appUrl,
		icons: [`${appUrl}/logo.png`],
	},
});

const queryClient = new QueryClient();

export default function AppKitProvider({ children }: { children: ReactNode }) {
	return (
		<WagmiProvider config={wagmiAdapter.wagmiConfig as unknown as Config}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
}
