import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TopCardLayout = ({
	children,
	columns = 2,
}: {
	children: ReactNode;
	columns?: 2 | 3;
}) => {
	return (
		<div
			className={cn(
				"grid w-full gap-4",
				columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
			)}
		>
			{children}
		</div>
	);
};

export default TopCardLayout;
