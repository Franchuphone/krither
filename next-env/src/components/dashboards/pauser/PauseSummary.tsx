"use client";

import PauseCard from "@/components/cards/PauseCard";
import TopCardLayout from "@/components/cards/TopCardLayout";
import { usePauseState } from "@/hooks/usePauseState";
import { Bitcoin, Container } from "lucide-react";

const PauseSummary = () => {
	const { registryPause, paymasterPause } = usePauseState();

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
