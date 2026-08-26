"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ClockIcon,
	LifeBuoy,
	ShieldCheckIcon,
	ShieldXIcon,
	type LucideIcon,
} from "lucide-react";
import { useCallback, type ReactNode } from "react";
import { useConnection } from "wagmi";
import { getProducerRequest } from "@/app/actions/producer/registration";
import ProducerRegistrationForm from "@/components/dashboards/ProducerRegistrationForm";
import LoadingAlert from "@/components/nav/LoadingAlert";
import { Button } from "@/components/ui/button";
import type { ProducerStatus } from "@/lib/producerRegistration";
import { cn } from "@/lib/utils";

const STATUS_SCREENS: Record<
	ProducerStatus,
	{ icon: LucideIcon; title: string; text: ReactNode }
> = {
	PENDING: {
		icon: ClockIcon,
		title: "Demande en cours d'examen",
		text: (
			<>
				Votre dossier a bien été reçu.
				<br /> Un administrateur le vérifiera sous peu.
			</>
		),
	},
	APPROVED: {
		icon: ShieldCheckIcon,
		title: "Dossier validé",
		text: (
			<>
				Votre dossier a bien été validé.
				<br /> Votre accès à la plateforme est désormais actif.
			</>
		),
	},
	REJECTED: {
		icon: ShieldXIcon,
		title: "Demande refusée",
		text: (
			<>
				Votre dossier a été rejeté.
				<br /> Contactez le support pour plus de détails.
			</>
		),
	},
};

function Unregistered() {
	const { address } = useConnection();
	const queryClient = useQueryClient();

	const { data: request, isPending } = useQuery({
		queryKey: ["producer-request", address],
		queryFn: () => getProducerRequest(address as string),
		enabled: !!address,
	});

	const refresh = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: ["producer-request", address],
		});
	}, [queryClient, address]);

	if (!address || isPending) {
		return <LoadingAlert text="Chargement de votre dossier…" />;
	}

	if (!request) {
		return (
			<ProducerRegistrationForm account={address} onSubmitted={refresh} />
		);
	}

	const { icon: Icon, title, text } = STATUS_SCREENS[request.status];
	const refused = request.status === "REJECTED";

	return (
		<section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<Icon
				className={cn(
					"size-10",
					refused ? "text-destructive" : "text-primary",
				)}
			/>
			<h1 className="text-3xl font-bold tracking-tight text-foreground">
				{title}
			</h1>
			<p className="max-w-md text-foreground-secondary">{text}</p>
			<p className="text-sm text-muted-foreground">
				{request.companyName} : déposé le{" "}
				{new Date(request.createdAt).toLocaleDateString("fr-FR")}
			</p>
			{refused && (
				<Button variant="secondary" size="lg" className="mt-4">
					<LifeBuoy className="mr-2" />
					Contacter le support
				</Button>
			)}
		</section>
	);
}

export default Unregistered;
