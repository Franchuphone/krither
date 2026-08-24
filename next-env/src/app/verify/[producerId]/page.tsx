import { BadgeCheckIcon, ScanBarcodeIcon, ShieldAlertIcon } from "lucide-react";
import LotRefForm from "@/components/dashboards/verify/LotRefForm";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { verifyProducer } from "@/lib/verification";

export default async function VerifyProducerPage({
	params,
}: {
	params: Promise<{ producerId: string }>;
}) {
	const { producerId } = await params;
	const producer = await verifyProducer(producerId);

	if (!producer) {
		return (
			<div className="flex w-full max-w-3xl flex-col gap-6 text-left">
				<Card className="w-full gap-4">
					<CardHeader className="flex flex-row items-start gap-3">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
							<ShieldAlertIcon className="size-4.5" />
						</span>
						<span className="flex flex-col gap-1">
							<CardTitle className="text-base">
								Producteur introuvable
							</CardTitle>
							<CardDescription>
								Aucun producteur ne correspond à la référence
								fournie. <br />
								Veuillez vérifier le lien ou le QR code présent
								sur le produit.
							</CardDescription>
						</span>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const { accredited, companyName } = producer;

	return (
		<div className="flex w-full max-w-3xl flex-col gap-6 text-left">
			<Card className="w-full gap-4">
				<CardHeader className="flex flex-col items-center gap-3 sm:flex-row">
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
							{companyName ?? `Producteur ${producer.producerId}`}
						</CardTitle>
					</span>
				</CardHeader>
			</Card>

			<Card className="w-full gap-4">
				<CardHeader className="flex flex-col items-start gap-3 sm:flex-row">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						<ScanBarcodeIcon className="size-4.5" />
					</span>
					<span className="flex flex-col gap-1">
						<CardTitle className="text-base">
							Vérifier un lot
						</CardTitle>
						<CardDescription>
							Saisissez le numéro du lot que vous souhaitez
							vérifier pour consulter son parcours et ses
							documents.
						</CardDescription>
					</span>
				</CardHeader>

				<CardContent>
					<LotRefForm producerId={producer.producerId} />
				</CardContent>
			</Card>
		</div>
	);
}
