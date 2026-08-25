"use client";

import { Bitcoin, Container } from "lucide-react";
import { useReadContract } from "wagmi";
import { paymasterABI, paymasterAddress } from "@/lib/paymaster";
import PauseCard from "@/components/cards/PauseCard";
import TopCardLayout from "@/components/cards/TopCardLayout";
import { registryABI, registryAddress } from "@/lib/registry";



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
