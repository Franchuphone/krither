"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PackagePlusIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createLotDraft } from "@/app/actions/producer/lots";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	EMPTY_ITEM,
	EMPTY_LOT,
	isLotValid,
	MAX_ITEMS,
	normalizeLot,
	validateLot,
	type LotInput,
} from "@/lib/lot";

const Field = ({
	id,
	label,
	value,
	onChange,
	placeholder,
	error,
	disabled,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	error?: string;
	disabled?: boolean;
}) => (
	<div className="flex flex-col gap-1.5">
		<Label htmlFor={id} className="text-muted-foreground">
			{label}
		</Label>
		<Input
			id={id}
			value={value}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
			disabled={disabled}
			aria-invalid={!!error}
		/>
		{error && <p className="text-xs text-destructive">{error}</p>}
	</div>
);

const LotDraftForm = () => {
	const [lot, setLot] = useState<LotInput>(EMPTY_LOT);
	const queryClient = useQueryClient();

	const errors = validateLot(normalizeLot(lot));
	const touched = lot.name.length > 0 || lot.ref.length > 0;

	const save = useMutation({
		mutationFn: async () => {
			const state = await createLotDraft(lot);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => {
			toast.success("Brouillon enregistré");
			setLot(EMPTY_LOT);
			queryClient.invalidateQueries();
		},
		onError: (error) => toast.error(error.message),
	});

	const setItem = (
		index: number,
		patch: Partial<LotInput["items"][number]>,
	) =>
		setLot((current) => ({
			...current,
			items: current.items.map((item, position) =>
				position === index ? { ...item, ...patch } : item,
			),
		}));

	return (
		<Card className="w-full gap-4">
			<CardHeader className="flex flex-row items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<PackagePlusIcon className="size-4.5" />
				</span>
				<span className="flex flex-col gap-1">
					<CardTitle className="text-base">Nouveau lot</CardTitle>
					<CardDescription>
						Décrivez le lot et ses articles. <br />
						Ceci est un brouillon et ne sera ancré sur la blockchain
						qu&apos;au moment où vous le désirerez.
					</CardDescription>
				</span>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<Field
						id="lot-name"
						label="Nom du lot"
						value={lot.name}
						onChange={(name) =>
							setLot((current) => ({ ...current, name }))
						}
						placeholder="Récolte de printemps"
						error={touched ? errors.name : undefined}
						disabled={save.isPending}
					/>
					<Field
						id="lot-ref"
						label="Numéro de lot"
						value={lot.ref}
						onChange={(ref) =>
							setLot((current) => ({ ...current, ref }))
						}
						placeholder="2026001"
						error={touched ? errors.ref : undefined}
						disabled={save.isPending}
					/>
					<div className="sm:col-span-2">
						<Field
							id="lot-description"
							label="Description du lot"
							value={lot.description}
							onChange={(description) =>
								setLot((current) => ({
									...current,
									description,
								}))
							}
							placeholder="Optionnel"
							disabled={save.isPending}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<span className="text-xs tracking-wide text-muted-foreground uppercase">
						Articles
					</span>

					{lot.items.map((item, index) => (
						<div
							key={index}
							className="grid items-start gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_6rem_auto]"
						>
							<Field
								id={`item-${index}-name`}
								label="Nom"
								value={item.name}
								onChange={(name) => setItem(index, { name })}
								placeholder="Miel de châtaignier"
								error={
									touched ?
										errors.items?.[index]?.name
									:	undefined
								}
								disabled={save.isPending}
							/>
							<Field
								id={`item-${index}-description`}
								label="Description"
								value={item.description}
								onChange={(description) =>
									setItem(index, { description })
								}
								placeholder="Optionnel"
								disabled={save.isPending}
							/>
							<Field
								id={`item-${index}-quantity`}
								label="Unités"
								value={item.quantity}
								onChange={(quantity) =>
									setItem(index, { quantity })
								}
								placeholder="120"
								error={
									touched ?
										errors.items?.[index]?.quantity
									:	undefined
								}
								disabled={save.isPending}
							/>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Retirer l'article"
								className="mt-6"
								disabled={
									lot.items.length === 1 || save.isPending
								}
								onClick={() =>
									setLot((current) => ({
										...current,
										items: current.items.filter(
											(_, position) => position !== index,
										),
									}))
								}
							>
								<XIcon />
							</Button>
						</div>
					))}

					<Button
						variant="secondary"
						className="self-start"
						disabled={
							lot.items.length >= MAX_ITEMS || save.isPending
						}
						onClick={() =>
							setLot((current) => ({
								...current,
								items: [...current.items, EMPTY_ITEM],
							}))
						}
					>
						<PlusIcon />
						Ajouter un article
					</Button>
				</div>
			</CardContent>

			<CardFooter className="justify-end">
				<Button
					disabled={!isLotValid(errors) || save.isPending}
					onClick={() => save.mutate()}
				>
					{save.isPending ?
						<Loader2Icon className="animate-spin" />
					:	"Enregistrer le brouillon"}
				</Button>
			</CardFooter>
		</Card>
	);
};

export default LotDraftForm;
