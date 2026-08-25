"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileTextIcon, Loader2Icon, PaperclipIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
	depositLotDocument,
	removeLotDocument,
	type LotDocumentView,
} from "@/app/actions/producer/lots";
import { Button } from "@/components/ui/button";
import { DOCUMENT_ACCEPT } from "@/lib/lot";

const DocumentRow = ({
	document,
	editable,
}: {
	document: LotDocumentView;
	editable: boolean;
}) => {
	const queryClient = useQueryClient();

	const remove = useMutation({
		mutationFn: async () => {
			const state = await removeLotDocument(document.id);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => queryClient.invalidateQueries(),
		onError: (error) => toast.error(error.message),
	});

	return (
		<div className="flex items-center gap-2 text-xs">
			<FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
			<span className="truncate text-foreground">{document.name}</span>
			{editable && (
				<Button
					variant="ghost"
					size="icon"
					aria-label="Retirer le document"
					className="ml-auto size-6"
					disabled={remove.isPending}
					onClick={() => remove.mutate()}
				>
					{remove.isPending ?
						<Loader2Icon className="size-3.5 animate-spin" />
					:	<XIcon className="size-3.5" />}
				</Button>
			)}
		</div>
	);
};

const LotDocuments = ({
	lotId,
	itemId,
	documents,
	editable,
	label,
	max,
}: {
	lotId: string;
	itemId?: string;
	documents: LotDocumentView[];
	editable: boolean;
	label: string;
	max: number;
}) => {
	const input = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const deposit = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("lotId", lotId);
			if (itemId) formData.append("itemId", itemId);

			const state = await depositLotDocument(formData);
			if (state.error) throw new Error(state.error);
		},
		onSuccess: () => {
			toast.success("Document déposé");
			queryClient.invalidateQueries();
		},
		onError: (error) => toast.error(error.message),
	});

	if (!editable && documents.length === 0) return null;

	return (
		<div className="flex flex-col gap-1.5">
			{documents.map((document) => (
				<DocumentRow
					key={document.id}
					document={document}
					editable={editable}
				/>
			))}

			{editable && (
				<>
					<input
						ref={input}
						type="file"
						accept={DOCUMENT_ACCEPT}
						className="hidden"
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							if (file) deposit.mutate(file);
						}}
					/>
					<Button
						variant="secondary"
						size="sm"
						className="self-start"
						disabled={deposit.isPending || documents.length >= max}
						onClick={() => input.current?.click()}
					>
						{deposit.isPending ?
							<Loader2Icon className="animate-spin" />
						:	<PaperclipIcon />}
						{label}
					</Button>
				</>
			)}
		</div>
	);
};

export default LotDocuments;
