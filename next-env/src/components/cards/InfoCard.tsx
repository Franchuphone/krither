import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InfoCardProps = {
	label: string;
	/** Undefined while the read is in flight. */
	value?: string;
	/** Rendered small next to the value, e.g. "ETH". */
	unit?: string;
	hint: string;
	icon: LucideIcon;
	/** Renders the value and the hint as a warning. */
	alert?: boolean;
};

const InfoCard = ({
	label,
	value,
	unit,
	hint,
	icon: Icon,
	alert = false,
}: InfoCardProps) => {
	const isLoading = value === undefined;

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
						isLoading ? "text-muted-foreground"
						: alert ? "text-destructive"
						: "text-foreground",
					)}
				>
					{isLoading ? "-" : value}
					{!isLoading && unit && (
						<span className="ml-1.5 text-base font-medium text-muted-foreground">
							{unit}
						</span>
					)}
				</p>
				<p
					className={cn(
						"text-xs",
						alert && !isLoading ?
							"text-destructive"
						:	"text-muted-foreground",
					)}
				>
					{isLoading ? "Lecture sur la blockchain…" : hint}
				</p>
			</div>
		</Card>
	);
};

export default InfoCard;
