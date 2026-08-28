"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2Icon } from "lucide-react";
import { getProducerDossier } from "@/app/actions/producer/registration";
import DossierDetails from "@/components/cards/DossierDetails";
import CardHeading from "@/components/cards/CardHeading";
import { Card, CardContent } from "@/components/ui/card";
import { legalFormLabel } from "@/lib/producerRegistration";
import LotLabel from "./QrLabel";

const ProducerProfile = () => {
	const { data: dossier, isPending } = useQuery({
		queryKey: ["producer-dossier"],
		queryFn: getProducerDossier,
	});

	if (isPending) {
		return (
			<p className="text-sm text-muted-foreground">
				Chargement de votre dossier…
			</p>
		);
	}

	if (!dossier) {
		return (
			<p className="text-sm text-muted-foreground">
				Aucun dossier associé à ce compte.
			</p>
		);
	}

	return (
		<Card className="w-full gap-4">
			<CardHeading
				icon={Building2Icon}
				title={dossier.companyName}
				description={
					<>
						{legalFormLabel(dossier.legalForm)} · dossier déposé le{" "}
						{new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
					</>
				}
			/>

			<CardContent className="grid gap-3 sm:grid-cols-2">
				<DossierDetails dossier={dossier} />
				<div className="sm:col-span-2">
					<LotLabel />
				</div>
			</CardContent>
		</Card>
	);
};

export default ProducerProfile;
