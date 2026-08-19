"use client";

import { Fuel, Lock } from "lucide-react";
import { useReadContract } from "wagmi";
import StatCard from "@/components/reusable/StatCard";
import { entryPointABI } from "@/lib/entryPoint";
import { paymasterABI } from "@/lib/paymaster";
import TopCardLayout from "../reusable/TopCardLayout";

const paymasterAddress = process.env
	.NEXT_PUBLIC_PAYMASTER_PRODUCTION_ADDRESS as `0x${string}`;

/**
 * The two balances sponsorship depends on: the EntryPoint deposit pays for user
 * operations, the stake is what lets the paymaster be used at all. Either one
 * empty and nothing gets sponsored, so both sit above the admin controls.
 */
const FundingSummary = () => {
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
		<TopCardLayout>
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
		</TopCardLayout>
	);
};

export default FundingSummary;
