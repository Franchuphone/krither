"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRolesContext } from "@/components/connection/RoleGuard";
import Unregistered from "@/components/dashboards/Unregistered";
import LoadingAlert from "@/components/reusable/LoadingAlert";
import { areaHref, unlockedAreas } from "@/lib/dashboard";


export default function DashboardPage() {
	const roles = useRolesContext();
	const router = useRouter();
	const firstArea = unlockedAreas(roles)[0];

	useEffect(() => {
		if (firstArea) {
			router.replace(areaHref(firstArea));
		}
	}, [firstArea, router]);

	if (!roles.hasRole) {
		return <Unregistered />;
	}

	return <LoadingAlert text="Ouverture de votre tableau de bord…" />;
}
