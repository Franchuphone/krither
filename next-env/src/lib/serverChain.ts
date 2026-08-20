import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/** Server-side reads go straight to the node: the /api/rpc proxy is for the browser. */
export const serverClient = createPublicClient({
	chain: sepolia,
	transport: http(process.env.RPC_SEPOLIA),
});

export const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;
