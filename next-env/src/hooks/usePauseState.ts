import { paymasterABI, paymasterAddress } from "@/lib/paymaster";
import { registryABI, registryAddress } from "@/lib/registry";
import { useReadContract } from "wagmi";

export function usePauseState() {
	const { data: registryPause } = useReadContract({
		address: registryAddress,
		abi: registryABI,
		functionName: "paused",
		query: { enabled: !!registryAddress },
	});

	const { data: paymasterPause } = useReadContract({
		address: paymasterAddress,
		abi: paymasterABI,
		functionName: "paused",
		query: { enabled: !!paymasterAddress },
	});

	return { registryPause, paymasterPause };
}
