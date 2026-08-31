import {
	BadgeCheckIcon,
	BlocksIcon,
	ChevronDownIcon,
	HistoryIcon,
	ListCheckIcon,
	ShieldAlertIcon,
	SirenIcon,
} from "lucide-react";
import Detail from "@/components/nav/Detail";
import DocumentDialog from "@/components/dashboards/verify/DocumentDialog";
import TxDetailDialog from "@/components/dashboards/verify/TxDetailDialog";
import VerificationSequence from "@/components/dashboards/verify/VerificationSequence";
import { Badge } from "@/components/ui/badge";
import CardHeading from "@/components/cards/CardHeading";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ItemMetadata } from "@/lib/lot";
import {
	ipfsUrl,
	publicIpfsUrl,
	verifyLot,
	type LifecycleEntry,
} from "@/lib/verification";

const panelClass =
	"h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0";

/** UTC keeps the server render and the browser on the same string. */
const stepDateFormat = new Intl.DateTimeFormat("fr-FR", {
	dateStyle: "long",
	timeStyle: "short",
	timeZone: "UTC",
});

const Chevron = () => (
	<ChevronDownIcon className="size-4 shrink-0 self-center text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
);

const shortAddress = (address: string) =>
	`${address.slice(0, 6)}…${address.slice(-4)}`;

const LotLifecycle = ({ entries }: { entries: LifecycleEntry[] }) => {
	if (entries.length === 0) {
		return (
			<CardDescription>
				Aucune étape n&apos;a encore été enregistrée pour ce lot.
			</CardDescription>
		);
	}

	return (
		<ol className="flex flex-col gap-3 border-l border-border pl-4">
			{entries.map((entry) => (
				<li key={entry.txHash} className="relative flex flex-col gap-1">
					<span
						className={`absolute top-1.5 -left-5.25 size-2 rounded-full ${
							entry.kind === "transfer" ? "bg-muted-foreground" : "bg-primary"
						}`}
					/>

					<span className="text-xs text-muted-foreground tabular-nums">
						{stepDateFormat.format(new Date(entry.recordedAt))} UTC
					</span>

					{entry.kind === "transfer" ?
						<>
							<span className="text-sm font-medium text-foreground">
								Changement de détenteur
							</span>
							<span className="text-xs break-all text-muted-foreground">
								{entry.quantity}{" "}
								{Number(entry.quantity) > 1 ? "unités" : "unité"} de{" "}
								{shortAddress(entry.from)} vers {shortAddress(entry.to)}
							</span>
						</>
					:	<>
							<span className="text-sm font-medium text-foreground">
								{entry.metadata?.name ?? "Métadonnées indisponibles"}
							</span>

							{entry.metadata?.description && (
								<span className="text-xs text-muted-foreground">
									{entry.metadata.description}
								</span>
							)}

							{entry.metadata && (
								<ItemDocuments documents={entry.metadata.documents} />
							)}
						</>
					}
				</li>
			))}
		</ol>
	);
};

const LotDocuments = ({
	documents,
}: {
	documents: ItemMetadata["documents"];
}) => {
	if (documents.length === 0) return null;

	return (
		<div className="@container w-full">
			<ul className="grid gap-3 @min-[200px]:grid-cols-[repeat(auto-fill,minmax(min(10rem,calc(50%-0.375rem)),1fr))]">
				{documents.map((document) => (
					<li key={document.cid} className="min-w-0">
						<DocumentDialog
							name={document.name}
							cid={document.cid}
							url={ipfsUrl(document.cid)}
						/>
					</li>
				))}
			</ul>
		</div>
	);
};

const ItemDocuments = ({
	documents,
}: {
	documents: ItemMetadata["documents"];
}) => {
	if (documents.length === 0) return null;

	return (
		<ul className="flex flex-wrap gap-2">
			{documents.map((document) => (
				<li key={document.cid} className="w-24 shrink-0">
					<DocumentDialog
						name={document.name}
						cid={document.cid}
						url={ipfsUrl(document.cid)}
					/>
				</li>
			))}
		</ul>
	);
};

export default async function VerifyPage({
	params,
}: {
	params: Promise<{ producerId: string; ref: string }>;
}) {
	const { producerId, ref } = await params;
	const verified = await verifyLot(producerId, ref);

	if (!verified) {
		return (
			<VerificationSequence>
				<Card className="w-full gap-4">
					<CardHeading
						icon={ShieldAlertIcon}
						tone="destructive"
						title="Lot introuvable"
						description={
							<>
								Aucun lot ne correspond aux références fournies. <br />
								Vérifiez que vous avez saisi les bonnes informations ou
								contactez le producteur pour plus de précisions.
							</>
						}
					/>
				</Card>
			</VerificationSequence>
		);
	}

	const { lot, items, accredited, verifiedTx } = verified;
	const properties = lot?.properties;

	return (
		<VerificationSequence>
			<Card className="w-full gap-4">
				<CardHeading
					icon={BadgeCheckIcon}
					stack="start"
					title={lot?.name ?? `Lot ${verified.idLot}`}
					description={
						lot?.description ??
						"Métadonnées indisponibles sur la passerelle IPFS."
					}
					badge={
						<Badge
							variant={accredited ? "success" : "muted"}
							className="sm:order-last sm:ml-auto"
						>
							{accredited ? "Producteur vérifié" : "Producteur non vérifié"}
						</Badge>
					}
				/>

				<CardContent className="grid gap-3 sm:grid-cols-2">
					{properties?.producer && (
						<Detail label="Producteur" value={String(properties.producer)} />
					)}
					<Detail label="Numéro de lot" value={verified.ref} />
					{properties?.zone && (
						<Detail
							label="Zone de récolte / fabrication"
							value={String(properties.zone)}
						/>
					)}
					{properties?.producedAt && (
						<Detail
							label="Date de récolte / fabrication"
							value={new Date(String(properties.producedAt)).toLocaleDateString(
								"fr-FR",
							)}
						/>
					)}
					{properties?.quantity !== undefined && (
						<Detail
							label="Quantité produite"
							value={String(properties.quantity)}
						/>
					)}
					{lot && (
						<div className="sm:col-span-2">
							<LotDocuments documents={lot.documents} />
						</div>
					)}
				</CardContent>
			</Card>

			<Collapsible render={<Card className="w-full gap-0" />}>
				<CollapsibleTrigger className="group w-full cursor-pointer text-left">
					<CardHeading
						icon={ListCheckIcon}
						stack="centerNoBadge"
						title={`Composition : ${items.length} articles`}
						action={<Chevron />}
					/>
				</CollapsibleTrigger>

				<CollapsibleContent className={panelClass}>
					<CardContent className="pt-4">
						<ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
							{items.map((item, position) => (
								<li
									key={position}
									className="flex items-start gap-3 px-3 py-2.5"
								>
									<span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground tabular-nums">
										{position + 1}
									</span>

									<div className="flex min-w-0 flex-1 flex-col gap-1.5">
										<span className="truncate text-sm font-medium text-foreground">
											{item?.name ?? "Métadonnées indisponibles"}
										</span>
										{item?.description && (
											<span className="text-xs text-muted-foreground">
												{item.description}
											</span>
										)}
										{item && <ItemDocuments documents={item.documents} />}
									</div>

									{item?.properties.quantity !== undefined && (
										<span className="ml-auto shrink-0 text-sm font-medium text-foreground tabular-nums">
											{String(item.properties.quantity)}
											<span className="ml-1 text-xs font-normal text-muted-foreground">
												{Number(item.properties.quantity) > 1 ?
													"unités"
												:	"unité"}
											</span>
										</span>
									)}
								</li>
							))}
						</ul>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>

			<Collapsible render={<Card className="w-full gap-0" />}>
				<CollapsibleTrigger className="group w-full cursor-pointer text-left">
					<CardHeading
						icon={HistoryIcon}
						stack="centerNoBadge"
						title={`Historique : ${verified.lifecycle.length} événements`}
						action={<Chevron />}
					/>
				</CollapsibleTrigger>

				<CollapsibleContent className={panelClass}>
					<CardContent className="pt-4">
						<LotLifecycle entries={verified.lifecycle} />
					</CardContent>
				</CollapsibleContent>
			</Collapsible>

			<Collapsible render={<Card className="w-full gap-0" />}>
				<CollapsibleTrigger className="group w-full cursor-pointer text-left">
					<CardHeading
						icon={SirenIcon}
						stack="centerNoBadge"
						title="Informations importantes"
						action={<Chevron />}
					/>
				</CollapsibleTrigger>

				<CollapsibleContent className={panelClass}>
					<CardContent className="pt-4">
						<CardDescription className="max-w-[80ch] text-sm text-muted-foreground">
							Les données sont hébergées sur un service de stockage indépendant
							de Krither. <br />
							Elles sont infalsifiables et vérifiables grâce à la technologie
							blockchain. <br />
							Les informations présentes sur cette page ont été fournies par le
							producteur / fabricant, qui est seul responsable de leur véracité.{" "}
							<br />
							Krither ne peut être tenu responsable en cas de données erronées.{" "}
							<br />
							Vous avez un doute? Veuillez contacter notre support.
						</CardDescription>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>

			{verifiedTx ?
				<Card className="w-full gap-4">
					<CardHeading
						icon={BlocksIcon}
						stack="start"
						title="Preuve blockchain"
						description={
							<span className="flex">
								<TxDetailDialog
									verifiedTx={verifiedTx}
									cid={verified.cid}
									cidUrl={publicIpfsUrl(verified.cid)}
								/>
							</span>
						}
						badge={
							<Badge variant="success" className="sm:order-last sm:ml-auto">
								Confirmée
							</Badge>
						}
					/>
				</Card>
			:	<Card className="w-full gap-4">
					<CardHeading
						icon={BlocksIcon}
						tone="destructive"
						title="Preuve blockchain indisponible"
						description="La transaction d'ancrage n'a pas pu être lue sur la blockchain. Les données du lot restent valides, réessayez dans quelques instants."
					/>
				</Card>
			}
		</VerificationSequence>
	);
}
