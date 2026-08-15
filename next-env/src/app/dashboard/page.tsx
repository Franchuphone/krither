import RoleGuard from "@/components/connection/RoleGuard";

export default function DashboardPage() {
	return (
		<RoleGuard>
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
				<h1 className="text-4xl font-bold tracking-tight text-foreground">
					Dashboard
				</h1>
				<p className="max-w-md text-lg text-muted-foreground">
					You&apos;re connected. The Krither supply-chain dashboard
					will live here.
				</p>
			</main>
		</RoleGuard>
	);
}
