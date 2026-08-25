"use client";

import { usePathname } from "next/navigation";
import { useRolesContext } from "@/components/connection/RoleGuard";
import PillNav from "@/components/nav/PillNav";
import { areaHref, unlockedAreas } from "@/lib/dashboard";

const DashboardNav = () => {
	const roles = useRolesContext();
	const pathname = usePathname();
	const areas = unlockedAreas(roles);

	if (areas.length === 0) return null;

	// A single-role wallet has nothing to switch between: name the area instead.
	if (areas.length === 1) {
		return (
			<h1 className="text-center text-3xl font-bold tracking-tight text-foreground">
				Votre <span className="text-primary">tableau de bord</span>
			</h1>
		);
	}

	const items = areas.map((area) => ({
		key: area.segment,
		label: area.label,
		href: areaHref(area),
	}));

	return (
		<PillNav
			items={items}
			activeKey={
				areas.find((area) => pathname.startsWith(areaHref(area)))?.segment
			}
			label="Vos tableaux de bord"
		/>
	);
};

export default DashboardNav;
