"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const AddButton = ({
	icon: Icon,
	label,
	hint,
	compact,
	disabled,
	onClick,
}: {
	icon: LucideIcon;
	label: string;
	hint?: string;
	compact?: boolean;
	disabled?: boolean;
	onClick: () => void;
}) => (
	<button
		type="button"
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 text-xs tracking-kicker text-muted-foreground uppercase transition-colors outline-none hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
			compact ? "py-1.5" : "py-4",
		)}
	>
		<Icon className="size-3.5" />
		{label}
		{hint && <span className="opacity-60">{hint}</span>}
	</button>
);

export default AddButton;
