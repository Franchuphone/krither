"use client";

import { BlocksIcon, ExternalLinkIcon } from "lucide-react";
import { Fragment } from "react";
import CardHeading from "@/components/cards/CardHeading";
import Detail from "@/components/nav/Detail";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { addressUrl, txUrl } from "@/lib/blockExplorer";
import type { VerifiedTxLot } from "@/lib/verification";

/** UTC keeps the server render and the browser on the same string. */
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
	dateStyle: "long",
	timeStyle: "short",
	timeZone: "UTC",
});

const LinkDetail = ({
	label,
	value,
	href,
}: {
	label: string;
	value: string;
	href: string;
}) => (
	<div className="flex flex-col gap-0.5">
		<span className="text-xs tracking-kicker text-muted-foreground uppercase">
			{label}
		</span>
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="flex items-baseline gap-1.5 text-sm break-all text-primary hover:underline"
		>
			{value}
			<ExternalLinkIcon className="size-3.5 shrink-0 self-center" />
		</a>
	</div>
);

const TxDetailDialog = ({
	verifiedTx,
	cid,
	cidUrl,
}: {
	verifiedTx: VerifiedTxLot;
	cid: string;
	cidUrl: string;
}) => {
	const minedAt = `${dateFormat.format(new Date(verifiedTx.minedAt))} UTC`;

	return (
		<Dialog>
			<DialogTrigger className="group w-full cursor-pointer text-left">
				<Card className="w-full gap-4 transition-colors group-hover:border-primary">
					<CardHeading
						icon={BlocksIcon}
						stack="center"
						title="Preuve blockchain"
						description="Inscription sur la blockchain confirmée. Cliquez pour consulter le détail complet."
						badge={
							<Badge variant="success" className="sm:order-last sm:ml-auto">
								Confirmée
							</Badge>
						}
					/>
				</Card>
			</DialogTrigger>

			<DialogContent className="flex max-h-[90vh] w-[min(90vw,48rem)] flex-col gap-4 overflow-y-auto sm:max-w-none">
				<DialogHeader>
					<DialogTitle className="text-base">
						Transaction effectuée sur la blockchain
					</DialogTitle>
					<DialogDescription>
						Écriture du lot dans le registre Krither, publiée sur la blockchain
						et consultable par tous.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3 sm:grid-cols-2">
					<LinkDetail
						label="Transaction"
						value={verifiedTx.txHash}
						href={txUrl(verifiedTx.txHash)}
					/>
					<Detail label="Date d'ancrage" value={minedAt} />
					<LinkDetail
						label="Contrat"
						value={verifiedTx.contract}
						href={addressUrl(verifiedTx.contract)}
					/>
					<LinkDetail label="Dossier IPFS (CID)" value={cid} href={cidUrl} />
				</div>

				<section className="flex flex-col gap-2">
					<h3 className="text-xs tracking-kicker text-muted-foreground uppercase">
						Événements émis ({verifiedTx.events.length})
					</h3>

					<ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
						{verifiedTx.events.map((event, position) => (
							<li key={position} className="flex flex-col gap-2 px-3 py-2.5">
								<span className="text-sm font-medium text-foreground">
									{event.name}
								</span>
								<dl className="grid gap-x-3 gap-y-1 sm:grid-cols-[minmax(7rem,auto)_1fr]">
									{event.args.map((arg) => (
										<Fragment key={arg.name}>
											<dt className="text-xs tracking-kicker text-muted-foreground uppercase">
												{arg.name}
											</dt>
											<dd className="text-xs break-all text-foreground">
												{arg.value}
											</dd>
										</Fragment>
									))}
								</dl>
							</li>
						))}
					</ul>
				</section>
			</DialogContent>
		</Dialog>
	);
};

export default TxDetailDialog;
