"use client";

import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import CardHeading from "@/components/cards/CardHeading";
import { Card, CardFooter } from "@/components/ui/card";
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
			<CardHeading
				icon={ShieldCheckIcon}
				title={title}
				description={description}
			/>
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
