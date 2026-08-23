"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	FileTextIcon,
	Loader2Icon,
	PackagePlusIcon,
	PaperclipIcon,
	PlusIcon,
	XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	createLotDraft,
	depositLotDocument,
} from "@/app/actions/producer/lots";
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
	MAX_LOT_DOCUMENTS,
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
	type,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	error?: string;
	disabled?: boolean;
	type?: string;
}) => (
	<div className="flex flex-col gap-1.5">
		<Label htmlFor={id} className="text-muted-foreground">
			{label}
		</Label>
		<Input
			id={id}
			type={type}
			value={value}
			onChange={(event) => onChange(event.target.value)}
			placeholder={placeholder}
			disabled={disabled}
			aria-invalid={!!error}
		/>
		{error && <p className="text-xs text-destructive">{error}</p>}
	</div>
);

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

const FilePicker = ({
	label,
	files,
	max,
	onPick,
	onDrop,
	disabled,
}: {
	label: string;
	files: File[];
	max: number;
	onPick: (picked: File[]) => void;
	onDrop: (index: number) => void;
	disabled?: boolean;
}) => {
	const input = useRef<HTMLInputElement>(null);

	return (
		<div className="flex flex-col gap-1.5">
			{files.map((file, index) => (
				<div key={index} className="flex items-center gap-2 text-xs">
					<FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
					<span className="truncate text-foreground">
						{file.name}
					</span>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Retirer le document"
						className="ml-auto size-6"
						disabled={disabled}
						onClick={() => onDrop(index)}
					>
						<XIcon className="size-3.5" />
					</Button>
				</div>
			))}

			<input
				ref={input}
				type="file"
				accept={ACCEPT}
				multiple={max > 1}
				className="hidden"
				onChange={(event) => {
					const picked = Array.from(event.target.files ?? []);
					event.target.value = "";
					// Sliced rather than refused: picking six keeps the first five.
					if (picked.length > 0)
						onPick(picked.slice(0, max - files.length));
				}}
			/>
			<Button
				variant="secondary"
				size="sm"
				className="self-start"
				disabled={disabled || files.length >= max}
				onClick={() => input.current?.click()}
			>
				<PaperclipIcon />
				{label}
			</Button>
		</div>
	);
};

const LotDraftForm = () => {
	const [lot, setLot] = useState<LotInput>(EMPTY_LOT);
	const [lotFiles, setLotFiles] = useState<File[]>([]);
	const [itemFiles, setItemFiles] = useState<(File | null)[]>([null]);
	const queryClient = useQueryClient();

	const errors = validateLot(normalizeLot(lot));
	const touched = lot.name.length > 0 || lot.ref.length > 0;

	const save = useMutation({
		mutationFn: async () => {
			const state = await createLotDraft(lot);
			if (state.error || !state.lotId) {
				throw new Error(state.error ?? "Enregistrement impossible");
			}

			// Pinned only now: a document needs the lot it hangs from to exist.
			const deposits = [
				...lotFiles.map((file) => ({ file, itemId: undefined })),
				...itemFiles.flatMap((file, position) =>
					file ? [{ file, itemId: state.itemIds?.[position] }] : [],
				),
			];

			const failed: string[] = [];
			for (const { file, itemId } of deposits) {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("lotId", state.lotId);
				if (itemId) formData.append("itemId", itemId);

				const deposit = await depositLotDocument(formData);
				if (deposit.error) failed.push(file.name);
			}

			return failed;
		},
		onSuccess: (failed) => {
			if (failed.length === 0) toast.success("Brouillon enregistré");
			else
				toast.warning(
					`Brouillon enregistré, ${failed.join(", ")} non déposé`,
				);

			setLot(EMPTY_LOT);
			setLotFiles([]);
			setItemFiles([null]);
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

	const setItemFile = (index: number, file: File | null) =>
		setItemFiles((current) =>
			current.map((entry, position) =>
				position === index ? file : entry,
			),
		);

	return (
		<Card className="w-full gap-4">
			<CardHeader className="flex flex-row items-start gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<PackagePlusIcon className="size-4.5" />
				</span>
				<span className="flex flex-col gap-1">
					<CardTitle className="text-base">Nouveau lot</CardTitle>
					<CardDescription>
						Décrivez le lot et les articles le composant. <br />
						Les formats acceptés pour les documents sont : {
							ACCEPT
						}. <br />
						Ceci est un brouillon et ne sera ancré sur la blockchain
						qu&apos;au moment où vous le désirerez.
					</CardDescription>
				</span>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<Field
						id="lot-name"
						label="Nom"
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
					<Field
						id="lot-zone"
						label="Zone de récolte / fabrication"
						value={lot.zone}
						onChange={(zone) =>
							setLot((current) => ({ ...current, zone }))
						}
						placeholder="Baie de Saint-Brieuc"
						error={touched ? errors.zone : undefined}
						disabled={save.isPending}
					/>
					<Field
						id="lot-produced-at"
						label="Date de récolte / fabrication"
						type="date"
						value={lot.producedAt}
						onChange={(producedAt) =>
							setLot((current) => ({ ...current, producedAt }))
						}
						error={touched ? errors.producedAt : undefined}
						disabled={save.isPending}
					/>
					<div className="sm:col-span-2">
						<Field
							id="lot-description"
							label="Description"
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

					<div className="flex flex-col gap-3">
						<span className="text-xs tracking-wide text-muted-foreground uppercase">
							Documents
						</span>

						<FilePicker
							label={`Documents : maximum ${MAX_LOT_DOCUMENTS}`}
							files={lotFiles}
							max={MAX_LOT_DOCUMENTS}
							onPick={(picked) =>
								setLotFiles((current) => [
									...current,
									...picked,
								])
							}
							onDrop={(index) =>
								setLotFiles((current) =>
									current.filter(
										(_, position) => position !== index,
									),
								)
							}
							disabled={save.isPending}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<span className="text-xs tracking-wide text-muted-foreground uppercase">
						Composition
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
								onClick={() => {
									setLot((current) => ({
										...current,
										items: current.items.filter(
											(_, position) => position !== index,
										),
									}));
									setItemFiles((current) =>
										current.filter(
											(_, position) => position !== index,
										),
									);
								}}
							>
								<XIcon />
							</Button>

							<div className="sm:col-span-4">
								<FilePicker
									label="Document : 1 seul autorisé"
									max={1}
									files={
										itemFiles[index] ?
											[itemFiles[index]]
										:	[]
									}
									onPick={([file]) =>
										setItemFile(index, file)
									}
									onDrop={() => setItemFile(index, null)}
									disabled={save.isPending}
								/>
							</div>
						</div>
					))}

					<Button
						variant="secondary"
						className="self-start"
						disabled={
							lot.items.length >= MAX_ITEMS || save.isPending
						}
						onClick={() => {
							setLot((current) => ({
								...current,
								items: [...current.items, EMPTY_ITEM],
							}));
							setItemFiles((current) => [...current, null]);
						}}
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
