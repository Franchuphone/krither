"use client";

import { FileTextIcon } from "lucide-react";

const extensionOf = (name: string) => name.split(".").pop() ?? "";

const PdfThumbnail = ({ name, url }: { name: string; url: string }) => (
	<span className="relative size-full overflow-hidden ">
		<span className="flex size-full flex-col items-center justify-center gap-2 bg-linear-to-b from-muted to-muted/30 text-primary/70 transition-colors group-hover:text-primary">
			<FileTextIcon className="size-[70%]" />
			<span className="rounded-sm bg-background/70 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
				{extensionOf(name)}
			</span>
		</span>

		<iframe
			src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
			title={name}
			loading="lazy"
			tabIndex={-1}
			aria-hidden
			className="pointer-events-none absolute top-0 left-0 h-[320%] w-[320%] origin-top-left scale-[0.3333] border-0 bg-background"
		/>
	</span>
);

export default PdfThumbnail;
