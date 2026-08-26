"use client";

import { Fuel, Lock, Wallet } from "lucide-react";
import { useReadContract } from "wagmi";
import StatCard from "@/components/cards/StatCard";
import TopCardLayout from "@/components/cards/TopCardLayout";
import { usePaymasterState } from "@/hooks/usePaymasterState";
import { entryPointABI } from "@/lib/entryPoint";
import { paymasterABI, paymasterAddress } from "@/lib/paymaster";

const FundingSummary = () => {
	const { balance } = usePaymasterState();

	const { data: entryPoint } = useReadContract({
		address: paymasterAddress,
		abi: paymasterABI,
		functionName: "entryPoint",
		query: { enabled: !!paymasterAddress },
	});

	const { data: depositInfo } = useReadContract({
		address: entryPoint,
		abi: entryPointABI,
		functionName: "getDepositInfo",
		args: [paymasterAddress],
		query: { enabled: !!entryPoint && !!paymasterAddress },
	});

	return (
		<TopCardLayout columns={3}>
			<StatCard
				label="Dépôt EntryPoint"
				amount={depositInfo?.deposit}
				hint="Finance les opérations sponsorisées."
				icon={Fuel}
			/>
			<StatCard
				label="Stake"
				amount={depositInfo?.stake}
				hint={
					depositInfo?.staked ?
						"Verrouillé, le paymaster est utilisable."
					:	"Déverrouillé, le retrait est ouvert."
				}
				icon={Lock}
			/>
			<StatCard
				label="Solde du contrat"
				amount={balance}
				hint="Revenus d'abonnement disponibles."
				icon={Wallet}
			/>
		</TopCardLayout>
	);
};

export default FundingSummary;
