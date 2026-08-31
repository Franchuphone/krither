"use client";

import { FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import AddButton from "@/components/buttons/AddButton";
import { Button } from "@/components/ui/button";
import { DOCUMENT_ACCEPT } from "@/lib/lot";

const FilePicker = ({
	label,
	files,
	max,
	onPick,
	onDrop,
	disabled,
	compact,
}: {
	label: string;
	files: File[];
	max: number;
	onPick: (picked: File[]) => void;
	onDrop: (index: number) => void;
	disabled?: boolean;
	compact?: boolean;
}) => {
	const input = useRef<HTMLInputElement>(null);

	return (
		<div className="flex flex-col gap-1.5">
			{files.map((file, index) => (
				<div key={index} className="flex items-center gap-2 text-xs">
					<FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
					<span className="truncate text-foreground">{file.name}</span>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Retirer le document"
						className="ml-auto size-6 hover:bg-secondary hover:text-secondary-foreground"
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
				accept={DOCUMENT_ACCEPT}
				multiple={max > 1}
				className="hidden"
				onChange={(event) => {
					const picked = Array.from(event.target.files ?? []);
					event.target.value = "";
					// Sliced rather than refused: picking six keeps the first five.
					if (picked.length > 0) onPick(picked.slice(0, max - files.length));
				}}
			/>
			<AddButton
				icon={PaperclipIcon}
				label={label}
				hint={`${files.length}/${max}`}
				compact={compact}
				disabled={disabled || files.length >= max}
				onClick={() => input.current?.click()}
			/>
		</div>
	);
};

export default FilePicker;
