import { keccak256, toBytes } from "viem";

export const DEFAULT_ADMIN_ROLE =
	"0x0000000000000000000000000000000000000000000000000000000000000000" as const;
export const PRODUCER_ROLE = keccak256(toBytes("PRODUCER_ROLE"));
export const RESELLER_ROLE = keccak256(toBytes("RESELLER_ROLE"));
export const CONSUMER_ROLE = keccak256(toBytes("CONSUMER_ROLE"));
export const PAUSER_ROLE = keccak256(toBytes("PAUSER_ROLE"));
export const PAYMASTER_ROLE = keccak256(toBytes("PAYMASTER_ROLE"));
export const USERS_ADMIN_ROLE = keccak256(toBytes("USERS_ADMIN_ROLE"));
export const PLANS_ADMIN_ROLE = keccak256(toBytes("PLANS_ADMIN_ROLE"));

/** Roles administered by DEFAULT_ADMIN_ROLE. */
export const ADMIN_ROLE_OPTIONS = [
	{ value: DEFAULT_ADMIN_ROLE, label: "Administration générale" },
	{ value: USERS_ADMIN_ROLE, label: "Gestion des utilisateurs" },
	{ value: PLANS_ADMIN_ROLE, label: "Gestion des abonnements" },
	{ value: PAUSER_ROLE, label: "Gestion de la sécurité" },
	{ value: PAYMASTER_ROLE, label: "Gestion du paymaster" },
] as const;

/** Roles administered by USERS_ADMIN_ROLE. */
export const USER_ROLE_OPTIONS = [
	{ value: PRODUCER_ROLE, label: "Producteur" },
	{ value: RESELLER_ROLE, label: "Revendeur" },
	{ value: CONSUMER_ROLE, label: "Consommateur" },
] as const;
