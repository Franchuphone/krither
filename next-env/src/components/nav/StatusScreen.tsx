import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import CardHeading from "@/components/cards/CardHeading";
import { Card, CardFooter } from "@/components/ui/card";

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
				<CardHeading
					icon={Icon}
					title={title}
					description={description}
					tone="destructive"
				/>
				{children && (
					<CardFooter className="justify-end gap-2">{children}</CardFooter>
				)}
			</Card>
		</div>
	</div>
);

export default StatusScreen;
