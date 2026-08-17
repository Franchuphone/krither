import type { RolesContext } from "@/components/connection/RoleGuard";

export type RoleFlag = Extract<keyof RolesContext, `is${string}`>;

export type DashboardArea = {
	segment: string;
	label: string;
	description: string;
	flag: RoleFlag;
};

/** Single source of truth for the dashboard nav, the overview cards and the per-route guards. */
export const DASHBOARD_AREAS: DashboardArea[] = [
	{
		segment: "admin",
		label: "Admin",
		description: "Manage accreditations and platform roles.",
		flag: "isAdmin",
	},
	{
		segment: "producer",
		label: "Producer",
		description: "Create and track your product lots.",
		flag: "isProducer",
	},
	{
		segment: "pauser",
		label: "Pauser",
		description: "Freeze and resume platform operations.",
		flag: "isPauser",
	},
	{
		segment: "paymaster",
		label: "Paymaster",
		description: "Fund and monitor gas sponsorship.",
		flag: "isPaymaster",
	},
];

export function unlockedAreas(roles: RolesContext) {
	return DASHBOARD_AREAS.filter((area) => roles[area.flag]);
}

export function areaHref(area: DashboardArea) {
	return `/dashboard/${area.segment}`;
}
