import {
	BadgeCheckIcon,
	ListCheckIcon,
	ShieldAlertIcon,
	SirenIcon,
} from "lucide-react";
import Detail from "@/components/reusable/Detail";
import DocumentDialog from "@/components/dashboards/verify/DocumentDialog";
import VerificationSequence from "@/components/dashboards/verify/VerificationSequence";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ItemMetadata } from "@/lib/lot";
import { ipfsUrl, verifyLot } from "@/lib/verification";

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
					<CardHeader className="flex flex-row items-start gap-3">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
							<ShieldAlertIcon className="size-4.5" />
						</span>
						<span className="flex flex-col gap-1">
							<CardTitle className="text-base">
								Lot introuvable
							</CardTitle>
							<CardDescription>
								Aucun lot ne correspond aux références fournies.{" "}
								<br />
								Veuillez vérifier que vous avez saisi les bonnes
								informations ou contactez le producteur pour
								plus d&apos;informations.
							</CardDescription>
						</span>
					</CardHeader>
				</Card>
			</VerificationSequence>
		);
	}

	const { lot, items, accredited } = verified;
	const properties = lot?.properties;

	return (
		<VerificationSequence>
			<Card className="w-full gap-4">
				<CardHeader className="flex flex-col items-center gap-3 sm:flex-row">
					<div className="flex w-full items-center justify-between gap-3 sm:contents">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
							<SirenIcon className="size-4.5" />
						</span>
						<CardTitle className="text-base">
							Informations importantes
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<CardDescription className="max-w-[80ch] text-sm text-muted-foreground">
						Les données sont hébergées sur un service de stockage
						indépendant de Krither. <br />
						Elles sont infalsifiables et vérifiables grâce à la
						technologie blockchain. <br />
						Les informations présentes sur cette page ont été
						fournies par le producteur / fabricant, qui est seul
						responsable de leur véracité. <br />
						Krither ne peut être tenu responsable en cas de données
						erronées. <br />
						Vous avez un doute? Veuillez contacter notre support.
					</CardDescription>
				</CardContent>
			</Card>

			<Card className="w-full gap-4">
				<CardHeader className="flex flex-col items-start gap-3 sm:flex-row">
					<div className="flex w-full items-center justify-between gap-3 sm:contents">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
							<BadgeCheckIcon className="size-4.5" />
						</span>
						<Badge
							variant={accredited ? "success" : "muted"}
							className="sm:order-last sm:ml-auto"
						>
							{accredited ?
								"Producteur vérifié"
							:	"Producteur non vérifié"}
						</Badge>
					</div>
					<span className="flex flex-col gap-1">
						<CardTitle className="text-base">
							{lot?.name ?? `Lot ${verified.idLot}`}
						</CardTitle>
						<CardDescription>
							{lot?.description ??
								"Métadonnées indisponibles sur la passerelle IPFS."}
						</CardDescription>
					</span>
				</CardHeader>

				<CardContent className="grid gap-3 sm:grid-cols-2">
					{properties?.producer && (
						<Detail
							label="Producteur"
							value={String(properties.producer)}
						/>
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
							value={new Date(
								String(properties.producedAt),
							).toLocaleDateString("fr-FR")}
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

			<Card className="w-full gap-4">
				<CardHeader className="flex flex-col items-center gap-3 sm:flex-row">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						<ListCheckIcon className="size-4.5" />
					</span>
					<CardTitle className="text-base">
						Composition : {items.length} articles
					</CardTitle>
				</CardHeader>

				<CardContent>
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
										{item?.name ??
											"Métadonnées indisponibles"}
									</span>
									{item?.description && (
										<span className="text-xs text-muted-foreground">
											{item.description}
										</span>
									)}
									{item && (
										<ItemDocuments
											documents={item.documents}
										/>
									)}
								</div>

								{item?.properties.quantity !== undefined && (
									<span className="ml-auto shrink-0 text-sm font-medium text-foreground tabular-nums">
										{String(item.properties.quantity)}
										<span className="ml-1 text-xs font-normal text-muted-foreground">
											{(
												Number(
													item.properties.quantity,
												) > 1
											) ?
												"unités"
											:	"unité"}
										</span>
									</span>
								)}
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</VerificationSequence>
	);
}
