import { BadgeCheckIcon, ScanBarcodeIcon, ShieldAlertIcon } from "lucide-react";
import LotRefForm from "@/components/dashboards/verify/LotRefForm";
import { Badge } from "@/components/ui/badge";
import CardHeading from "@/components/cards/CardHeading";
import { Card, CardContent } from "@/components/ui/card";
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
					<CardHeading
						icon={ShieldAlertIcon}
						tone="destructive"
						title="Producteur introuvable"
						description={
							<>
								Aucun producteur ne correspond à la référence
								fournie. <br />
								Veuillez vérifier le lien ou le QR code présent
								sur le produit.
							</>
						}
					/>
				</Card>
			</div>
		);
	}

	const { accredited, companyName } = producer;

	return (
		<div className="flex w-full max-w-3xl flex-col gap-6 text-left">
			<Card className="w-full gap-4">
				<CardHeading
					icon={BadgeCheckIcon}
					stack="center"
					title={companyName ?? `Producteur ${producer.producerId}`}
					badge={
						<Badge
							variant={accredited ? "success" : "muted"}
							className="sm:order-last sm:ml-auto"
						>
							{accredited ?
								"Producteur vérifié"
							:	"Producteur non vérifié"}
						</Badge>
					}
				/>
			</Card>

			<Card className="w-full gap-4">
				<CardHeading
					icon={ScanBarcodeIcon}
					stack="start"
					title="Vérifier un lot"
					description="Saisissez le numéro du lot que vous souhaitez vérifier pour consulter son parcours et ses documents."
				/>

				<CardContent>
					<LotRefForm producerId={producer.producerId} />
				</CardContent>
			</Card>
		</div>
	);
}
