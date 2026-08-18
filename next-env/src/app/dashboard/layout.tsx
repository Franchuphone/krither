import type { ReactNode } from "react";
import RoleGuard from "@/components/connection/RoleGuard";
import DashboardNav from "@/components/dashboards/DashboardNav";

// Header and Footer are fixed overlays (z-50), so the padding here is what keeps
// the dashboard clear of them — without it the header sits on top of the nav and
// swallows its pointer events.
export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col gap-12 px-6 pt-32 pb-28">
			<RoleGuard>
				<DashboardNav />
				<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
					{children}
				</div>
			</RoleGuard>
		</div>
	);
}
