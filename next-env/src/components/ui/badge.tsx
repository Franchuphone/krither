import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium tracking-kicker whitespace-nowrap uppercase [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-2.5",
	{
		variants: {
			variant: {
				default: "bg-primary/10 text-primary",
				secondary: "bg-secondary text-secondary-foreground",
				outline: "border-border text-muted-foreground",
				muted: "bg-muted text-muted-foreground",
				proof: "bg-proof text-proof-foreground",
				success: "bg-success/15 text-success",
				warning: "bg-warning/10 text-warning",
				destructive: "bg-destructive/10 text-destructive",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return (
		<span
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
