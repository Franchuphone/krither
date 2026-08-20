"use client";

import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";

const SessionGate = ({
	title,
	description,
	children,
}: {
	title: string;
	description: ReactNode;
	children: ReactNode;
}) => {
	const { active, isPending, signIn, signingIn } = useSession();

	if (isPending) {
		return (
			<p className="text-sm text-muted-foreground">
				Vérification de la session…
			</p>
		);
	}

	if (active) return children;

	return (
		<Card className="w-full gap-4">
			<CardHeader className="flex flex-row items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<ShieldCheckIcon className="size-4.5" />
				</span>
				<span className="flex flex-col gap-1">
					<CardTitle className="text-base">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</span>
			</CardHeader>
			<CardFooter className="justify-end">
				<Button disabled={signingIn} onClick={() => signIn()}>
					{signingIn ?
						<Loader2Icon className="animate-spin" />
					:	"Vérifier ma session"}
				</Button>
			</CardFooter>
		</Card>
	);
};

export default SessionGate;
