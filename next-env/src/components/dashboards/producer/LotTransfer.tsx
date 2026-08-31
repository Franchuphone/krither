"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, SendIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
	listProducerLots,
	lotHolding,
	prepareLotTransfer,
} from "@/app/actions/producer/lots";
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
import { registryABI, registryAddress } from "@/lib/registry";

const LotTransfer = () => {
	const [lotId, setLotId] = useState<string | null>(null);
	const [recipient, setRecipient] = useState("");
	const [quantity, setQuantity] = useState("");
	const [preparing, setPreparing] = useState(false);

	const { data: lots, isPending } = useQuery({
		queryKey: ["producer-lots-list"],
		queryFn: listProducerLots,
	});

	const { data: holding } = useQuery({
		queryKey: ["lot-holding", lotId],
		queryFn: () => lotHolding(lotId ?? ""),
		enabled: !!lotId,
	});

	const minted = lots?.filter((lot) => lot.status === "MINTED") ?? [];
	const selected = minted.find((lot) => lot.id === lotId);
	const held = Number(holding?.holding?.balance ?? 0);

	const { write: transfer, busy: writing } = useTrackedWrite({
		toastId: "lot-transfer",
		pendingMessage: "Transfert en cours",
		successMessage: `${selected?.name ?? "Lot"} transféré`,
		onConfirmed: useCallback(async () => {
			setRecipient("");
			setQuantity("");
		}, []),
	});

	const send = async () => {
		if (!lotId) return;

		setPreparing(true);
		toast.loading("Vérification du transfert", { id: "lot-transfer" });

		const { plan, error } = await prepareLotTransfer(
			lotId,
			recipient,
			held > 1 ? quantity : "1",
		).catch(() => ({ plan: undefined, error: "Transfert impossible" }));
		setPreparing(false);

		if (error || !plan) {
			toast.error(error ?? "Transfert impossible", { id: "lot-transfer" });
			return;
		}

		toast.dismiss("lot-transfer");
		transfer({
			address: registryAddress,
			abi: registryABI,
			functionName: "safeTransferFrom",
			args: [
				plan.from,
				plan.to,
				BigInt(plan.idItem),
				BigInt(plan.quantity),
				"0x",
			],
		});
	};

	const busy = preparing || writing;

	return (
		<Card className="w-full gap-4">
			<CardHeading
				icon={SendIcon}
				stack="centerNoBadge"
				title="Transférer un lot"
				description="Le lot change de détenteur sur la blockchain. Le nouveau détenteur pourra à son tour enregistrer des étapes dans son historique."
			/>

			<CardContent className="flex flex-col gap-3">
				{isPending ?
					<p className="text-sm text-muted-foreground">Chargement des lots…</p>
				: minted.length === 0 ?
					<p className="text-sm text-muted-foreground">
						Aucun lot ancré : seul un lot inscrit sur la blockchain peut être
						transféré.
					</p>
				:	<>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="transfer-lot" className="text-muted-foreground">
								Lot
							</Label>
							<Select
								value={lotId}
								onValueChange={(next) => setLotId(String(next ?? ""))}
								disabled={busy}
							>
								<SelectTrigger id="transfer-lot" className="w-full">
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
								htmlFor="transfer-recipient"
								className="text-muted-foreground"
							>
								Wallet destinataire
							</Label>
							<Input
								id="transfer-recipient"
								value={recipient}
								onChange={(event) => setRecipient(event.target.value)}
								placeholder="0x…"
								disabled={busy || !lotId}
							/>
						</div>

						{held > 1 && (
							<div className="flex flex-col gap-1.5">
								<Label
									htmlFor="transfer-quantity"
									className="text-muted-foreground"
								>
									Quantité
								</Label>
								<Input
									id="transfer-quantity"
									value={quantity}
									onChange={(event) =>
										setQuantity(event.target.value.replace(/\D/g, ""))
									}
									placeholder={`${held} unités détenues`}
									disabled={busy}
								/>
							</div>
						)}

						<div className="flex justify-end">
							<Button
								disabled={
									busy ||
									!lotId ||
									recipient.trim().length === 0 ||
									(held > 1 && quantity.length === 0)
								}
								onClick={send}
							>
								{busy ?
									<Loader2Icon className="animate-spin" />
								:	<>
										<SendIcon />
										Transférer
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

export default LotTransfer;
