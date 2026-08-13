import {
	concat,
	encodeFunctionData,
	pad,
	parseAbi,
	parseGwei,
	toHex,
	zeroAddress,
	type Address,
	type Hex,
} from "viem";
import type { PrivateKeyAccount } from "viem/accounts";

/** The call shapes a reference ERC-4337 account exposes */
export const accountAbi = parseAbi([
	"function execute(address target, uint256 value, bytes data)",
	"struct Call { address target; uint256 value; bytes data; }",
	"function executeBatch(Call[] calls)",
	"function transferOwnership(address newOwner)",
]);

export type UserOp = {
	sender: Address;
	nonce: bigint;
	initCode: Hex;
	callData: Hex;
	accountGasLimits: Hex;
	preVerificationGas: bigint;
	gasFees: Hex;
	paymasterAndData: Hex;
	signature: Hex;
};

/**
 * Gas limits and fees a bundler would quote. Kept low enough that the cost the
 * EntryPoint hands the paymaster stays under `MAX_COST_PER_OP`, and high
 * enough to mint a lot.
 */
const VERIFICATION_GAS = 200_000n;
const CALL_GAS = 400_000n;
const PRE_VERIFICATION_GAS = 60_000n;
const PAYMASTER_VERIFICATION_GAS = 150_000n;
const PAYMASTER_POSTOP_GAS = 100_000n;
const MAX_PRIORITY_FEE = parseGwei("1");
const MAX_FEE = parseGwei("5");

/** Two 16-byte halves, the layout PackedUserOperation packs limits into */
const packHalves = (high: bigint, low: bigint): Hex =>
	concat([pad(toHex(high), { size: 16 }), pad(toHex(low), { size: 16 })]);

/** The byte an operation carries to ask for a free operation */
export const ONBOARDING_LANE: Hex = "0x01";

/** paymaster ++ validation gas ++ postOp gas ++ paymaster-specific data */
export const packPaymasterAndData = (paymaster: Address, data: Hex = "0x"): Hex =>
	concat([
		paymaster,
		pad(toHex(PAYMASTER_VERIFICATION_GAS), { size: 16 }),
		pad(toHex(PAYMASTER_POSTOP_GAS), { size: 16 }),
		data,
	]);

/** Encodes `execute(target, value, data)`, the single-call account shape */
export const executeCall = (target: Address, value: bigint, data: Hex): Hex =>
	encodeFunctionData({
		abi: accountAbi,
		functionName: "execute",
		args: [target, value, data],
	});

/** Encodes `executeBatch`, the many-calls account shape */
export const executeBatch = (
	calls: readonly { target: Address; value: bigint; data: Hex }[],
): Hex =>
	encodeFunctionData({
		abi: accountAbi,
		functionName: "executeBatch",
		args: [calls],
	});

/** A call shape the paymaster is not meant to recognise */
export const unsupportedCall = (): Hex =>
	encodeFunctionData({
		abi: accountAbi,
		functionName: "transferOwnership",
		args: [zeroAddress],
	});

/**
 * An operation carrying only the fields the paymaster reads. Enough for the
 * mock EntryPoint; the real one needs `signUserOp` on top.
 */
export function buildUserOp(fields: {
	sender: Address;
	callData: Hex;
	nonce?: bigint;
	paymaster?: Address;
	paymasterData?: Hex;
}): UserOp {
	return {
		sender: fields.sender,
		nonce: fields.nonce ?? 0n,
		initCode: "0x",
		callData: fields.callData,
		accountGasLimits: packHalves(VERIFICATION_GAS, CALL_GAS),
		preVerificationGas: PRE_VERIFICATION_GAS,
		gasFees: packHalves(MAX_PRIORITY_FEE, MAX_FEE),
		paymasterAndData: fields.paymaster
			? packPaymasterAndData(fields.paymaster, fields.paymasterData)
			: "0x",
		signature: "0x",
	};
}

/**
 * Signs the EntryPoint's typed-data hash of an operation. v0.8 accounts
 * recover it raw, with no EIP-191 prefix.
 */
export async function signUserOp(
	entryPoint: {
		read: { getUserOpHash: (args: readonly [UserOp]) => Promise<Hex> };
	},
	owner: PrivateKeyAccount,
	userOp: UserOp,
): Promise<UserOp> {
	const signature = await owner.sign({
		hash: await entryPoint.read.getUserOpHash([userOp]),
	});

	return { ...userOp, signature };
}
