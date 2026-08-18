import { LifeBuoy } from "lucide-react";
import { Button } from "../ui/button";

function Unregistered() {
	return (
		<section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<h1 className="text-4xl font-bold tracking-tight text-foreground">
				Accès refusé
			</h1>
			<p className="max-w-md text-lg text-muted-foreground">
				Votre compte n&apos;est pas accrédité sur la plateforme Krither.
				<br />
				Contactez notre support pour obtenir un accès.
			</p>
			<Button variant="secondary" size="lg" className="mt-4">
				<LifeBuoy className="mr-2" />
				Contacter le support
			</Button>
		</section>
	);
}

export default Unregistered;
