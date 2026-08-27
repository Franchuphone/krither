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
		description: "Gérer les statuts d'administration de la plateforme.",
		flag: "isAdmin",
	},
	{
		segment: "users-admin",
		label: "Utilisateurs",
		description: "Accréditer et révoquer les utilisateurs de la plateforme.",
		flag: "isUsersAdmin",
	},
	{
		segment: "plans",
		label: "Abonnements",
		description: "Gérer les formules d'abonnements.",
		flag: "isPlansAdmin",
	},
	{
		segment: "producer",
		label: "Producteur",
		description: "Créer et suivre vos lots de produits.",
		flag: "isProducer",
	},
	{
		segment: "pauser",
		label: "Pauser",
		description: "Suspendre et relancer les opérations de la plateforme.",
		flag: "isPauser",
	},
	{
		segment: "paymaster",
		label: "Paymaster",
		description: "Approvisionner et surveiller le sponsoring du gas.",
		flag: "isPaymaster",
	},
];

export function unlockedAreas(roles: RolesContext) {
	return DASHBOARD_AREAS.filter((area) => roles[area.flag]);
}

export function areaHref(area: DashboardArea) {
	return `/dashboard/${area.segment}`;
}
