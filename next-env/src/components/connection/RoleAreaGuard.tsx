"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useRolesContext } from "@/components/connection/RoleGuard";
import type { RoleFlag } from "@/lib/dashboard";

/**
 * Per-area gate under /dashboard.
 *
 * RoleGuard only resolves the roles, it does not restrict routes: without this
 * any connected wallet could open /dashboard/admin by typing the URL. A wallet
 * missing the area's role is sent back to the dashboard overview.
 */
export default function RoleAreaGuard({
	flag,
	children,
}: {
	flag: RoleFlag;
	children: ReactNode;
}) {
	const roles = useRolesContext();
	const router = useRouter();
	const unlocked = !!roles[flag];

	useEffect(() => {
		if (!unlocked) {
			router.replace("/dashboard");
		}
	}, [unlocked, router]);

	if (!unlocked) return null;

	return <>{children}</>;
}
