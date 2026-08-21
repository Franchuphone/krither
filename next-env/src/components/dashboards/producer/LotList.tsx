"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnchorIcon, ChevronDownIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
	listProducerLots,
	pinLotDraft,
	recordLotMint,
} from "@/app/actions/producer/lots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { registryABI } from "@/lib/registry";
import LotQrCode from "./LotQrCode";

const registryAddress = process.env
	.NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS as `0x${string}`;

type Lot = Awaited<ReturnType<typeof listProducerLots>>[number];

const LotRow = ({ lot }: { lot: Lot }) => {
	const queryClient = useQueryClient();
	const [pinning, setPinning] = useState(false);

	const {
		mutate: mintLot,
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
			const state = await recordLotMint(lot.id, hash as `0x${string}`);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => {
			toast.success(`${lot.name} ancré`, { id: lot.id });
			queryClient.invalidateQueries();
		},
		onError: (error) => toast.error(error.message, { id: lot.id }),
	});

	useEffect(() => {
		if (isSuccess && record.isIdle) record.mutate();
	}, [isSuccess, record]);

	useEffect(() => {
		if (confirming) toast.loading("Ancrage en cours", { id: lot.id });
	}, [confirming, lot.id]);

	useEffect(() => {
		const error = writeError ?? receiptError;
		if (!error) return;
		toast.error(
			"shortMessage" in error ? error.shortMessage : error.message,
			{
				id: lot.id,
			},
		);
	}, [writeError, receiptError, lot.id]);

	const anchor = async () => {
		setPinning(true);
		toast.loading("Publication des métadonnées", { id: lot.id });

		const { plan, error } = await pinLotDraft(lot.id).catch(() => ({
			plan: undefined,
			error: "Publication impossible",
		}));
		setPinning(false);

		if (error || !plan) {
			toast.error(error ?? "Publication impossible", { id: lot.id });
			return;
		}

		toast.dismiss(lot.id);
		mintLot({
			address: registryAddress,
			abi: registryABI,
			functionName: "mintLot",
			args: [
				plan.quantities.map((quantity) => BigInt(quantity)),
				plan.cid,
				BigInt(plan.ref),
			],
		});
	};

	const minted = lot.status === "MINTED";
	const units = lot.items.reduce((total, item) => total + item.quantity, 0);
	const busy = pinning || signing || confirming || record.isPending;

	return (
		<Collapsible render={<li className="bg-card" />}>
			<CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
				<ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />

				<span className="truncate text-sm font-medium text-foreground">
					{lot.name}
				</span>

				<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
					Réf. {lot.ref}
				</span>

				<Badge
					variant={minted ? "success" : "muted"}
					className="ml-auto"
				>
					{minted ? "Ancré" : "Brouillon"}
				</Badge>
			</CollapsibleTrigger>

			<CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
				<div className="flex flex-col gap-3 border-t border-border px-3 py-3">
					{lot.description && (
						<p className="text-sm text-muted-foreground">
							{lot.description}
						</p>
					)}

					<ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
						{lot.items.map((item) => (
							<li
								key={item.index}
								className="flex items-center gap-3 px-3 py-2.5"
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground tabular-nums">
									{item.index}
								</span>

								<span className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-medium text-foreground">
										{item.name}
									</span>
									{item.description && (
										<span className="truncate text-xs text-muted-foreground">
											{item.description}
										</span>
									)}
								</span>

								<span className="ml-auto shrink-0 text-sm font-medium text-foreground tabular-nums">
									{item.quantity}
									<span className="ml-1 text-xs font-normal text-muted-foreground">
										{item.quantity > 1 ? "unités" : "unité"}
									</span>
								</span>
							</li>
						))}
					</ul>

					<div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground">
						<span className="flex min-w-0 items-baseline gap-1.5">
							<span className="rounded bg-muted px-1.5 py-0.5 font-medium tracking-wide uppercase">
								QTT
							</span>
							<span className="tabular-nums">{units} unités</span>
						</span>
						{lot.zone && (
							<span className="flex min-w-0 items-baseline gap-1.5">
								<span className="rounded bg-muted px-1.5 py-0.5 font-medium tracking-wide uppercase">
									Zone
								</span>
								<span className="truncate">{lot.zone}</span>
							</span>
						)}
						{lot.producedAt && (
							<span className="flex min-w-0 items-baseline gap-1.5">
								<span className="rounded bg-muted px-1.5 py-0.5 font-medium tracking-wide uppercase">
									Date
								</span>
								<span className="tabular-nums">
									{new Date(lot.producedAt).toLocaleDateString(
										"fr-FR",
									)}
								</span>
							</span>
						)}
						{lot.cid && (
							<span className="flex min-w-0 items-baseline gap-1.5">
								<span className="rounded bg-muted px-1.5 py-0.5 font-medium tracking-wide uppercase">
									CID
								</span>
								<span className="break-all">{lot.cid}</span>
							</span>
						)}
					</div>

					{minted && <LotQrCode lotId={lot.id} />}

					{!minted && (
						<div className="flex justify-end">
							<Button disabled={busy} onClick={anchor}>
								{busy ?
									<Loader2Icon className="animate-spin" />
								:	<>
										<AnchorIcon />
										Ancrer le lot
									</>
								}
							</Button>
						</div>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

const LotList = () => {
	const { data: lots, isPending } = useQuery({
		queryKey: ["producer-lots-list"],
		queryFn: listProducerLots,
	});

	if (isPending) {
		return (
			<p className="text-sm text-muted-foreground">
				Chargement des lots…
			</p>
		);
	}

	if (!lots?.length) {
		return (
			<p className="text-sm text-muted-foreground">
				Aucun lot enregistré pour le moment.
			</p>
		);
	}

	return (
		<ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
			{lots.map((lot) => (
				<LotRow key={lot.id} lot={lot} />
			))}
		</ul>
	);
};

export default LotList;
