/**
 * Minimal slice of the ERC-4337 EntryPoint (v0.8): the paymaster exposes its
 * deposit through `entryPointBalance()` but nothing reads back the stake, so
 * that figure has to come from the EntryPoint itself.
 */
export const entryPointABI = [
	{
		type: "function",
		name: "getDepositInfo",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [
			{
				name: "info",
				type: "tuple",
				components: [
					{ name: "deposit", type: "uint256" },
					{ name: "staked", type: "bool" },
					{ name: "stake", type: "uint112" },
					{ name: "unstakeDelaySec", type: "uint32" },
					{ name: "withdrawTime", type: "uint48" },
				],
			},
		],
	},
] as const;
