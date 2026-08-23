"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import HomeButton from "@/components/reusable/HomeButton";
import StatusScreen from "@/components/reusable/StatusScreen";
import { Button } from "@/components/ui/button";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => console.error(error), [error]);

	return (
		<StatusScreen
			icon={TriangleAlertIcon}
			title="Une erreur est survenue"
			description={
				<>
					Cette page n&apos;a pas pu être affichée. <br />
					{error.digest ?
						`Référence de l'incident : ${error.digest}`
					:	"Réessayez dans un instant."}
				</>
			}
		>
			<HomeButton />
			<Button variant="outline" onClick={reset}>
				Réessayer
			</Button>
		</StatusScreen>
	);
}
