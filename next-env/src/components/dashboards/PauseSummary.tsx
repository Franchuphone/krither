"use client";

import { Bitcoin, Container } from "lucide-react";
import { useReadContract } from "wagmi";
import { paymasterABI } from "@/lib/paymaster";
import { registryABI } from "@/lib/registry";
import TopCardLayout from "../reusable/TopCardLayout";
import PauseCard from "../reusable/PauseCard";

const paymasterAddress = process.env
	.NEXT_PUBLIC_PAYMASTER_PRODUCTION_ADDRESS as `0x${string}`;

const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;

const PauseSummary = () => {
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

	return (
		<TopCardLayout>
			<PauseCard
				label="Registre"
				paused={registryPause}
				hint="Plateforme opérationelle"
				pausedHint="Plateforme suspendue"
				icon={Container}
			/>
			<PauseCard
				label="Paymaster"
				paused={paymasterPause}
				hint="Paymaster opérationnel"
				pausedHint="Paymaster suspendu"
				icon={Bitcoin}
			/>
		</TopCardLayout>
	);
};

export default PauseSummary;
