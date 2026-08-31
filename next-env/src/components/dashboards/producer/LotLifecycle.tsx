"use client";

import { useQuery } from "@tanstack/react-query";
import { HistoryIcon, Loader2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	listProducerLots,
	pinLifecycleStep,
} from "@/app/actions/producer/lots";
import FilePicker from "@/components/buttons/FilePicker";
import CardHeading from "@/components/cards/CardHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTrackedWrite } from "@/hooks/useTrackedWrite";
import { MAX_STEP_DESCRIPTION } from "@/lib/lot";
import { registryABI, registryAddress } from "@/lib/registry";

const LotLifecycle = () => {
	const [lotId, setLotId] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [document, setDocument] = useState<File | null>(null);
	const [pinning, setPinning] = useState(false);

	const { data: lots, isPending } = useQuery({
		queryKey: ["producer-lots-list"],
		queryFn: listProducerLots,
	});

	const minted = lots?.filter((lot) => lot.status === "MINTED") ?? [];
	const selected = minted.find((lot) => lot.id === lotId);

	const { write: addStep, busy: writing } = useTrackedWrite({
		toastId: "lifecycle-step",
		pendingMessage: "Enregistrement de l'étape",
		successMessage: `Étape ajoutée à ${selected?.name ?? "votre lot"}`,
		onConfirmed: useCallback(async () => {
			setTitle("");
			setDescription("");
			setDocument(null);
		}, []),
	});

	const record = async () => {
		if (!lotId) return;

		setPinning(true);
		toast.loading("Publication de l'étape", { id: "lifecycle-step" });

		const formData = new FormData();
		formData.append("lotId", lotId);
		formData.append("title", title);
		formData.append("description", description);
		if (document) formData.append("file", document);

		const { plan, error } = await pinLifecycleStep(formData).catch(() => ({
			plan: undefined,
			error: "Publication impossible",
		}));
		setPinning(false);

		if (error || !plan) {
			toast.error(error ?? "Publication impossible", { id: "lifecycle-step" });
			return;
		}

		toast.dismiss("lifecycle-step");
		addStep({
			address: registryAddress,
			abi: registryABI,
			functionName: "addLifecycleChange",
			args: [BigInt(plan.idItem), plan.cid],
		});
	};

	const busy = pinning || writing;

	return (
		<Card className="w-full gap-4">
			<CardHeading
				icon={HistoryIcon}
				stack="centerNoBadge"
				title="Historique d'un lot"
				description="Chaque étape est publiée sur la blockchain et devient visible de tous sur la page de vérification du lot."
			/>

			<CardContent className="flex flex-col gap-3">
				{isPending ?
					<p className="text-sm text-muted-foreground">Chargement des lots…</p>
				: minted.length === 0 ?
					<p className="text-sm text-muted-foreground">
						Aucun lot ancré : seul un lot inscrit sur la blockchain peut
						recevoir une étape.
					</p>
				:	<>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="lifecycle-lot" className="text-muted-foreground">
								Lot
							</Label>
							<Select
								value={lotId}
								onValueChange={(next) => setLotId(String(next ?? ""))}
								disabled={busy}
							>
								<SelectTrigger id="lifecycle-lot" className="w-full">
									<SelectValue placeholder="Choisir un lot" />
								</SelectTrigger>
								<SelectContent>
									{minted.map((lot) => (
										<SelectItem key={lot.id} value={lot.id}>
											{lot.name} - réf. {lot.ref}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label
								htmlFor="lifecycle-title"
								className="text-muted-foreground"
							>
								Étape
							</Label>
							<Input
								id="lifecycle-title"
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								placeholder="Séchage, mise en cave, expédition…"
								disabled={busy || !lotId}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label
								htmlFor="lifecycle-description"
								className="text-muted-foreground"
							>
								Description
							</Label>
							<Input
								id="lifecycle-description"
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								placeholder="Facultatif"
								maxLength={MAX_STEP_DESCRIPTION}
								disabled={busy || !lotId}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label className="text-muted-foreground">Document</Label>
							<FilePicker
								label="Document : 1 seul autorisé"
								compact
								max={1}
								files={document ? [document] : []}
								onPick={([file]) => setDocument(file)}
								onDrop={() => setDocument(null)}
								disabled={busy || !lotId}
							/>
						</div>

						<div className="flex justify-end">
							<Button
								disabled={busy || !lotId || title.trim().length < 2}
								onClick={record}
							>
								{busy ?
									<Loader2Icon className="animate-spin" />
								:	<>
										<HistoryIcon />
										Ajouter l&apos;étape
									</>
								}
							</Button>
						</div>
					</>
				}
			</CardContent>
		</Card>
	);
};

export default LotLifecycle;
