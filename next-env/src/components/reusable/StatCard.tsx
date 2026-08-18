import type { LucideIcon } from "lucide-react";
import { formatEther } from "viem";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
	icon: Icon,
	// tsconfig targets below ES2020, so no bigint literals here.
	lowWaterMark = BigInt(0),
}: StatCardProps) => {
	const isLoading = amount === undefined;
	const isLow = !isLoading && amount <= lowWaterMark;

	return (
		<Card className="w-full gap-3">
			<div className="flex items-center gap-2 px-(--card-spacing) text-muted-foreground">
				<Icon className="size-4" />
				<span className="text-xs font-medium tracking-wide uppercase">
					{label}
				</span>
			</div>
			<div className="flex flex-col gap-1 px-(--card-spacing)">
				<p
					className={cn(
						"text-3xl font-bold tracking-tight tabular-nums",
						isLoading && "text-muted-foreground",
						isLow && "text-destructive",
						!isLoading && !isLow && "text-foreground",
					)}
				>
					{isLoading ? "—" : formatAmount(amount)}
					{!isLoading && (
						<span className="ml-1.5 text-base font-medium text-muted-foreground">
							ETH
						</span>
					)}
				</p>
				<p
					className={cn(
						"text-xs",
						isLow ? "text-destructive" : "text-muted-foreground",
					)}
				>
					{isLoading ?
						"Lecture sur la blockchain…"
					: isLow ?
						"Non approvisionné"
					:	hint}
				</p>
			</div>
		</Card>
	);
};

export default StatCard;
