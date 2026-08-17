import { LifeBuoy } from "lucide-react";
import { Button } from "../ui/button";

function Unregistered() {
	return (
		<section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<h1 className="text-4xl font-bold tracking-tight text-foreground">
				Access Denied
			</h1>
			<p className="max-w-md text-lg text-muted-foreground">
				You&apos;re not accredited to access the Krither supply-chain
				platform. <br />
				Please contact our support for access.
			</p>
			<Button variant="secondary" size="lg" className="mt-4">
				<LifeBuoy className="mr-2" />
				Contact Support
			</Button>
		</section>
	);
}

export default Unregistered;
