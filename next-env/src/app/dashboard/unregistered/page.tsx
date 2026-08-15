import RoleGuard from "@/components/connection/RoleGuard";
import { Button } from "@/components/ui/button";
import { BluetoothConnected } from "lucide-react";

export default function UnregisteredPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-4xl font-bold tracking-tight text-foreground">
				Access Denied
			</h1>
			<p className="max-w-md text-lg text-muted-foreground">
				You&apos;re not accredited to access the Krither supply-chain
				platform. <br />
				Please contact our support for access.
			</p>
			<Button variant="secondary" size="lg" className="mt-4">
				<BluetoothConnected className="mr-2" />
				Contact Support
			</Button>
		</main>
	);
}
