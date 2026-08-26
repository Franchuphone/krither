"use client";

import PdfThumbnail from "@/components/dashboards/verify/PdfThumbnail";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const isPdf = (name: string) => name.toLowerCase().endsWith(".pdf");

const labelClass =
	"shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium tracking-kicker text-muted-foreground uppercase";

const DocumentDialog = ({
	name,
	cid,
	url,
}: {
	name: string;
	cid: string;
	url: string;
}) => (
	<Dialog>
		<DialogTrigger className="group flex w-full min-w-0 cursor-pointer flex-col gap-1.5 text-left">
			<span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted transition-colors group-hover:border-primary">
				{
					isPdf(name) ?
						<PdfThumbnail name={name} url={url} />
						// eslint-disable-next-line @next/next/no-img-element
					:	<img
							src={url}
							alt={name}
							loading="lazy"
							className="size-full object-cover"
						/>

				}
			</span>
		</DialogTrigger>

		<DialogContent className="flex max-h-[90vh] w-[min(90vw,64rem)] flex-col gap-3 sm:max-w-none">
			<DialogHeader>
				<DialogTitle className="flex items-baseline gap-2 text-base">
					<span className={labelClass}>Nom</span>
					<span className="min-w-0 truncate">{name}</span>
				</DialogTitle>
				<DialogDescription className="flex items-baseline gap-2">
					<span className={labelClass}>CID</span>
					<span className="break-all">{cid}</span>
				</DialogDescription>
			</DialogHeader>

			{
				isPdf(name) ?
					<iframe
						src={url}
						title={name}
						className="h-[75vh] w-full rounded-md border border-border"
					/>
					// eslint-disable-next-line @next/next/no-img-element
				:	<img
						src={url}
						alt={name}
						className="max-h-[75vh] w-full rounded-md object-contain"
					/>

			}
		</DialogContent>
	</Dialog>
);

export default DocumentDialog;
