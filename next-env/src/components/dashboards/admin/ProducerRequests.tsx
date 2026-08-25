"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, FileCheck2Icon, Loader2Icon, XIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useTrackedWrite } from "@/hooks/useTrackedWrite";
import {
	approveProducer,
	listProducerRequests,
	rejectProducer,
} from "@/app/actions/admin/producers";
import SessionGate from "@/components/connection/SessionGate";
import DossierDetails from "@/components/cards/DossierDetails";
import { Button } from "@/components/ui/button";
import CardHeading from "@/components/cards/CardHeading";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	legalFormLabel,
	type ProducerDossier,
} from "@/lib/producerRegistration";
import { registryABI, registryAddress } from "@/lib/registry";
import { PRODUCER_ROLE } from "@/lib/roles";


const DossierCard = ({ dossier }: { dossier: ProducerDossier }) => {
	const queryClient = useQueryClient();

	// The DB only records the accreditation once its tx is mined.
	const { write: grantRole, busy: granting } = useTrackedWrite({
		toastId: dossier.id,
		pendingMessage: "Attribution du statut en cours",
		successMessage: `${dossier.companyName} accrédité`,
		onConfirmed: useCallback(async () => {
			const state = await approveProducer(dossier.id);
			if (state.error) throw new Error(state.error);
		}, [dossier.id]),
	});

	const reject = useMutation({
		mutationFn: async () => {
			const state = await rejectProducer(dossier.id);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => {
			toast.success(`Dossier ${dossier.companyName} refusé`);
			queryClient.invalidateQueries();
		},
		onError: (error) => toast.error(error.message),
	});

	const busy = granting || reject.isPending;

	return (
		<Card className="w-full gap-4">
			<CardHeading
				icon={FileCheck2Icon}
				title={dossier.companyName}
				description={
					<>
						{legalFormLabel(dossier.legalForm)} · déposé le{" "}
						{new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
					</>
				}
			/>

			<CardContent className="grid gap-3 sm:grid-cols-2">
				<DossierDetails dossier={dossier} />
			</CardContent>

			<CardFooter className="justify-end gap-2">
				<Button
					variant="ghost"
					disabled={busy}
					onClick={() => reject.mutate()}
				>
					<XIcon />
					Refuser
				</Button>
				<Button
					disabled={busy}
					onClick={() =>
						grantRole({
							address: registryAddress,
							abi: registryABI,
							functionName: "grantRole",
							args: [PRODUCER_ROLE, dossier.account],
						})
					}
				>
					{busy ?
						<Loader2Icon className="animate-spin" />
					:	<>
							<CheckIcon />
							Accréditer
						</>
					}
				</Button>
			</CardFooter>
		</Card>
	);
};

const DossierList = () => {
	const { data: dossiers, isPending } = useQuery({
		queryKey: ["producer-requests"],
		queryFn: listProducerRequests,
	});

	if (isPending) {
		return (
			<p className="text-sm text-muted-foreground">
				Chargement des dossiers…
			</p>
		);
	}

	if (!dossiers?.length) {
		return (
			<p className="text-sm text-muted-foreground">
				Aucune demande en attente.
			</p>
		);
	}

	return dossiers.map((dossier) => (
		<DossierCard key={dossier.id} dossier={dossier} />
	));
};

const ProducerRequests = () => (
	<SessionGate
		title="Vérification requise"
		description={
			<>
				Les dossiers de demande contiennent des données sensibles.
				<br />
				Pour des raisons de sécurité, veuillez vérifier votre session.
			</>
		}
	>
		<DossierList />
	</SessionGate>
);

export default ProducerRequests;
