"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2Icon } from "lucide-react";
import { getProducerDossier } from "@/app/actions/producer/registration";
import Detail from "@/components/reusable/Detail";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LEGAL_FORM_OPTIONS } from "@/lib/producerRegistration";

const legalFormLabel = (value: string) =>
	LEGAL_FORM_OPTIONS.find((option) => option.value === value)?.label ?? value;

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
			<CardHeader className="flex flex-row items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Building2Icon className="size-4.5" />
				</span>
				<span className="flex flex-col gap-1">
					<CardTitle className="text-base">
						{dossier.companyName}
					</CardTitle>
					<CardDescription>
						{legalFormLabel(dossier.legalForm)} · dossier déposé le{" "}
						{new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
					</CardDescription>
				</span>
			</CardHeader>

			<CardContent className="grid gap-3 sm:grid-cols-2">
				<Detail label="SIRET" value={dossier.siret} />
				<Detail label="Code APE" value={dossier.apeCode} />
				<Detail
					label="Représentant légal"
					value={dossier.representativeName}
				/>
				<Detail label="Email" value={dossier.email} />
				<Detail label="Téléphone" value={dossier.phone} />
				<Detail
					label="Siège social"
					value={`${dossier.street}, ${dossier.postalCode} ${dossier.city}, ${dossier.country}`}
				/>
				<div className="sm:col-span-2">
					<Detail label="Wallet" value={dossier.account} />
				</div>
			</CardContent>
		</Card>
	);
};

export default ProducerProfile;
