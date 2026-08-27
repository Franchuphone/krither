import { parseEther } from "viem";

/// `ether` is typed in ETH and converted to wei, `days` in days and converted to
/// seconds, so no one has to count zeroes.
export type ContractFieldType =
	| "address"
	| "uint"
	| "uint[]"
	| "bytes32"
	| "string"
	| "bool"
	| "ether"
	| "days";

export const SECONDS_PER_DAY = BigInt(86_400);

export type ContractField = {
	name: string;
	label: string;
	type: ContractFieldType;
	placeholder?: string;
	/** Only decides select versus free input: the value must still fit the type. */
	options?: readonly { value: string; label: string }[];
	/** Sends the field as the transaction value rather than an argument, which
	 *  is what a payable call needs. Only meaningful on an `ether` field. */
	asValue?: boolean;
};

export const accountField: ContractField = {
	name: "account",
	label: "Compte",
	type: "address",
	placeholder: "0x…",
};

export const roleField = (
	options: ContractField["options"],
): ContractField => ({
	name: "role",
	label: "Statut",
	type: "bytes32",
	placeholder: "Choisir un statut",
	options,
});

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const UINT = /^\d+$/;
const UINT_LIST = /^\d+(\s*,\s*\d+)*$/;
const BYTES32 = /^0x[0-9a-fA-F]{64}$/;
const DECIMAL = /^\d+(\.\d+)?$/;

export function isFieldValid(field: ContractField, raw: string) {
	const value = raw.trim();
	if (field.type === "bool") return true;
	if (!value) return false;

	switch (field.type) {
		case "address":
			return ADDRESS.test(value);
		case "uint":
		case "days":
			return UINT.test(value);
		case "uint[]":
			return UINT_LIST.test(value);
		case "bytes32":
			return BYTES32.test(value);
		case "ether":
			return DECIMAL.test(value);
		case "string":
			return true;
	}
}

export function toArgument(field: ContractField, raw: string) {
	const value = raw.trim();

	switch (field.type) {
		case "address":
		case "bytes32":
			return value as `0x${string}`;
		case "uint":
			return BigInt(value);
		case "days":
			return BigInt(value) * SECONDS_PER_DAY;
		case "uint[]":
			return value.split(",").map((item) => BigInt(item.trim()));
		case "ether":
			return parseEther(value);
		case "bool":
			return value === "true";
		default:
			return value;
	}
}

export function emptyValues(fields: readonly ContractField[]) {
	return Object.fromEntries(
		fields.map((field) => [field.name, field.type === "bool" ? "false" : ""]),
	);
}
