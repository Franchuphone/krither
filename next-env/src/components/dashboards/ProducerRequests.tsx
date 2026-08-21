"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckIcon,
	FileCheck2Icon,
	Loader2Icon,
	ShieldCheckIcon,
	XIcon,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
	approveProducer,
	listProducerRequests,
	rejectProducer,
} from "@/app/actions/admin/producers";
import Detail from "@/components/reusable/Detail";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";
import {
	LEGAL_FORM_OPTIONS,
	type ProducerDossier,
} from "@/lib/producerRegistration";
import { registryABI } from "@/lib/registry";
import { PRODUCER_ROLE } from "@/lib/roles";

const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;

const legalFormLabel = (value: string) =>
	LEGAL_FORM_OPTIONS.find((option) => option.value === value)?.label ?? value;

const DossierCard = ({ dossier }: { dossier: ProducerDossier }) => {
	const queryClient = useQueryClient();

	const {
		mutate: grantRole,
		data: hash,
		isPending: signing,
		error: writeError,
	} = useWriteContract();

	const {
		isLoading: confirming,
		isSuccess,
		error: receiptError,
	} = useWaitForTransactionReceipt({ hash });

	const record = useMutation({
		mutationFn: async () => {
			const state = await approveProducer(dossier.id);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => {
			toast.success(`${dossier.companyName} accrédité`, {
				id: dossier.id,
			});
			queryClient.invalidateQueries();
		},
		onError: (error) => toast.error(error.message, { id: dossier.id }),
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

	// The DB only records the accreditation once its tx is mined.
	useEffect(() => {
		if (isSuccess && record.isIdle) record.mutate();
	}, [isSuccess, record]);

	useEffect(() => {
		if (confirming) {
			toast.loading("Attribution du statut en cours", { id: dossier.id });
		}
	}, [confirming, dossier.id]);

	useEffect(() => {
		const error = writeError ?? receiptError;
		if (!error) return;
		toast.error(
			"shortMessage" in error ? error.shortMessage : error.message,
			{ id: dossier.id },
		);
	}, [writeError, receiptError, dossier.id]);

	const busy = signing || confirming || record.isPending || reject.isPending;

	return (
		<Card className="w-full gap-4">
			<CardHeader className="flex flex-row items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<FileCheck2Icon className="size-4.5" />
				</span>
				<span className="flex flex-col gap-1">
					<CardTitle className="text-base">
						{dossier.companyName}
					</CardTitle>
					<CardDescription>
						{legalFormLabel(dossier.legalForm)} · déposé le{" "}
						{new Date(dossier.createdAt).toLocaleDateString(
							"fr-FR",
						)}
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

const ProducerRequests = () => {
	const {
		active,
		isPending: sessionPending,
		signIn,
		signingIn,
	} = useSession();

	const { data: dossiers, isPending } = useQuery({
		queryKey: ["producer-requests"],
		queryFn: listProducerRequests,
		enabled: active,
	});

	if (sessionPending) {
		return (
			<p className="text-sm text-muted-foreground">
				Vérification de la session…
			</p>
		);
	}

	if (!active) {
		return (
			<Card className="w-full gap-4">
				<CardHeader className="flex flex-row items-start gap-3">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						<ShieldCheckIcon className="size-4.5" />
					</span>
					<span className="flex flex-col gap-1">
						<CardTitle className="text-base">
							Vérification requise
						</CardTitle>
						<CardDescription>
							Les dossiers de demande contiennent des données
							sensibles.
							<br />
							Pour des raisons de sécurité, veuillez vérifier
							votre session.
						</CardDescription>
					</span>
				</CardHeader>
				<CardFooter className="justify-end">
					<Button disabled={signingIn} onClick={() => signIn()}>
						{signingIn ?
							<Loader2Icon className="animate-spin" />
						:	"Vérifier"}
					</Button>
				</CardFooter>
			</Card>
		);
	}

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

export default ProducerRequests;
