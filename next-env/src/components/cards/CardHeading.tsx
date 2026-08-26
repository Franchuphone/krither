import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardHeadingProps = {
	icon: LucideIcon;
	title: ReactNode;
	description?: ReactNode;
	/** Tints the icon tile. */
	tone?: "primary" | "destructive";
	/** Faces the icon below sm, ends the row from sm up. */
	badge?: ReactNode;
	/** Closes the row, e.g. a refresh button. */
	action?: ReactNode;
	/** Stacks the icon above the text below sm, aligned centre or left. */
	stack?: "center" | "start" | "centerNoBadge";
	iconClassName?: string;
};

const CardHeading = ({
	icon: Icon,
	title,
	description,
	tone = "primary",
	badge,
	action,
	stack,
	iconClassName,
}: CardHeadingProps) => {
	const tile = (
		<span
			className={cn(
				"flex size-9 shrink-0 items-center justify-center rounded-md",
				tone === "destructive" ?
					"bg-destructive/10 text-destructive"
				:	"bg-primary/10 text-primary",
			)}
		>
			<Icon className={cn("size-4.5", iconClassName)} />
		</span>
	);

	return (
		<CardHeader
			className={cn(
				"flex gap-3",
				stack === "center" ? "flex-col items-center sm:flex-row"
				: stack === "start" ? "flex-col items-start sm:flex-row"
				: stack === "centerNoBadge" ? "flex-row items-center"
				: "flex-row items-start",
			)}
		>
			{/* sm:contents dissolves the wrapper so the badge rejoins the row. */}
			{badge ?
				<div className="flex w-full items-center justify-between gap-3 sm:contents">
					{tile}
					{badge}
				</div>
			:	tile}

			<span className={cn("flex flex-col gap-1", action && "flex-1")}>
				<CardTitle className="text-base">{title}</CardTitle>
				{description && (
					<CardDescription className="whitespace-pre-line">
						{description}
					</CardDescription>
				)}
			</span>

			{action}
		</CardHeader>
	);
};

export default CardHeading;
