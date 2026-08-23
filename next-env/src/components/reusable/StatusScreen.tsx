import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const StatusScreen = ({
	icon: Icon,
	title,
	description,
	children,
}: {
	icon: LucideIcon;
	title: string;
	description: ReactNode;
	children?: ReactNode;
}) => (
	<div className="flex min-h-screen flex-col px-6 pt-32 pb-28">
		<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center">
			<Card className="w-full gap-4">
				<CardHeader className="flex flex-row items-start gap-3">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
						<Icon className="size-4.5" />
					</span>
					<span className="flex flex-col gap-1">
						<CardTitle className="text-base">{title}</CardTitle>
						<CardDescription>{description}</CardDescription>
					</span>
				</CardHeader>
				{children && (
					<CardFooter className="justify-end gap-2">{children}</CardFooter>
				)}
			</Card>
		</div>
	</div>
);

export default StatusScreen;
