import type { LucideIcon } from "lucide-react";
import { formatEther } from "viem";
import InfoCard from "@/components/cards/InfoCard";

type StatCardProps = {
	label: string;
	/** Wei. Undefined while the read is in flight. */
	amount?: bigint;
	hint: string;
	icon: LucideIcon;
	/** Below this the balance reads as a warning rather than a healthy figure. */
	lowWaterMark?: bigint;
};

function formatAmount(amount: bigint) {
	return Number(formatEther(amount)).toLocaleString(undefined, {
		maximumFractionDigits: 5,
	});
}

const StatCard = ({
	label,
	amount,
	hint,
	icon,
	// tsconfig targets below ES2020, so no bigint literals here.
	lowWaterMark = BigInt(0),
}: StatCardProps) => {
	const isLow = amount !== undefined && amount <= lowWaterMark;

	return (
		<InfoCard
			label={label}
			value={amount === undefined ? undefined : formatAmount(amount)}
			unit="ETH"
			hint={isLow ? "Non approvisionné" : hint}
			icon={icon}
			alert={isLow}
		/>
	);
};

export default StatCard;
