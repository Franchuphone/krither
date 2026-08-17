"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRolesContext } from "@/components/connection/RoleGuard";
import { areaHref, unlockedAreas } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const linkClass =
	"rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
const inactiveClass =
	"text-muted-foreground hover:bg-primary/10 hover:text-primary";

export default function DashboardNav() {
	const roles = useRolesContext();
	const pathname = usePathname();
	const areas = unlockedAreas(roles);

	if (areas.length === 0) return null;

	// A single-role wallet has nothing to switch between: name the area instead.
	if (areas.length === 1) {
		return (
			<h1 className="text-center text-3xl font-bold tracking-tight text-foreground">
				Your <span className="text-primary">Dashboard</span>
			</h1>
		);
	}

	return (
		<nav className="mx-auto flex flex-wrap items-center justify-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
			{areas.map((area) => {
				const href = areaHref(area);
				const isActive = pathname.startsWith(href);

				return (
					<Link
						key={area.segment}
						href={href}
						aria-current={isActive ? "page" : undefined}
						className={cn(
							linkClass,
							isActive ?
								"bg-primary text-primary-foreground hover:bg-primary/90"
							:	inactiveClass,
						)}
					>
						{area.label}
					</Link>
				);
			})}
		</nav>
	);
}
