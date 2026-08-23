import type { ReactNode } from "react";

// Same spacing as the dashboard: Header and Footer are fixed overlays, and the
// padding is what keeps the page clear of them. No guard, the route is public.
export default function VerifyLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col gap-12 px-6 pt-32 pb-28">
			<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center">
				{children}
			</div>
		</div>
	);
}
