import { keccak256, toBytes } from "viem";

export const DEFAULT_ADMIN_ROLE =
	"0x0000000000000000000000000000000000000000000000000000000000000000" as const;
export const PRODUCER_ROLE = keccak256(toBytes("PRODUCER_ROLE"));
export const RESELLER_ROLE = keccak256(toBytes("RESELLER_ROLE"));
export const CONSUMER_ROLE = keccak256(toBytes("CONSUMER_ROLE"));
export const PAUSER_ROLE = keccak256(toBytes("PAUSER_ROLE"));
export const PAYMASTER_ROLE = keccak256(toBytes("PAYMASTER_ROLE"));
export const USERS_ADMIN_ROLE = keccak256(toBytes("USERS_ADMIN_ROLE"));

/** Every role an admin can grant, revoke or price a plan against. */
export const ROLE_OPTIONS = [
	{ value: DEFAULT_ADMIN_ROLE, label: "Admin" },
	{ value: PRODUCER_ROLE, label: "Producteur" },
	{ value: RESELLER_ROLE, label: "Revendeur" },
	{ value: CONSUMER_ROLE, label: "Consommateur" },
	{ value: PAUSER_ROLE, label: "Pauser" },
	{ value: PAYMASTER_ROLE, label: "Paymaster" },
] as const;
