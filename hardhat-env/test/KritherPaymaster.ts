import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encodeFunctionData, parseEther, zeroAddress, zeroHash } from "viem";

import {
	CID,
	MAX_COST_PER_OP,
	MAX_FREE_OPS,
	MONTHLY_PERIOD,
	MONTHLY_QUOTA,
	PAYMASTER_DEPOSIT,
	PAYMASTER_STAKE,
	PLAN_PRICE,
	REF,
	UNSTAKE_DELAY,
	accountOwner,
	deployMockedForPause,
	deployMockedPaymaster,
	deployMockedSingleOpSubscriber,
	deployMockedSubscriber,
	deployRealPaymaster,
	deploySponsoredAccount,
	deploySubscriptions,
	deployUnsubscribedAccount,
	item,
	networkHelpers,
	viem,
} from "./helpers/fixtures.js";
import {
	ONBOARDING_LANE,
	buildUserOp,
	executeBatch,
	executeCall,
	signUserOp,
	unsupportedCall,
} from "./helpers/userOp.js";

/** The EntryPoint reads a paymaster's verdict out of these two fields */
const OP_SUCCEEDED = 0;
const OP_REVERTED = 1;

/** Stands in for the hash the EntryPoint derives, which the paymaster ignores */
const USER_OP_HASH = zeroHash;

/** Cost the mocked EntryPoint reports once an operation has run */
const ACTUAL_GAS_COST = parseEther("0.001");
const ACTUAL_FEE_PER_GAS = 1n;

/** Validity windows ride in the 6 bytes above the authorizer address */
const validUntilOf = (validationData: bigint) =>
	(validationData >> 160n) & 0xffffffffffffn;

/** And `validAfter` in the 6 above those */
const validAfterOf = (validationData: bigint) =>
	(validationData >> 208n) & 0xffffffffffffn;

describe("KritherPaymaster - deployment", async function () {
	it("answers to the EntryPoint it was wired to", async function () {
		const { paymaster, entryPoint } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		assert.equal(
			(await paymaster.read.entryPoint()).toLowerCase(),
			entryPoint.address.toLowerCase(),
		);
	});

	it("opens the registry to sponsorship", async function () {
		const { paymaster, registry } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		assert.equal(
			await paymaster.read.sponsoredTargets([registry.address]),
			true,
		);
	});

	it("opens itself to sponsorship, so onboarding calls resolve", async function () {
		const { paymaster } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		assert.equal(
			await paymaster.read.sponsoredTargets([paymaster.address]),
			true,
		);
	});

	it("keeps every contract outside Krither closed", async function () {
		const { paymaster, other } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		assert.equal(
			await paymaster.read.sponsoredTargets([other.account.address]),
			false,
		);
	});

	it("sponsors nothing until a cost ceiling is set", async function () {
		const { registry, entryPoint } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		const fresh = await viem.deployContract("KritherPaymaster", [
			registry.address,
			entryPoint.address,
		]);

		assert.equal(await fresh.read.maxCostPerOp(), 0n);
	});

	it("reverts when deployed with the zero address as EntryPoint", async function () {
		const { paymaster, registry } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await viem.assertions.revertWithCustomError(
			viem.deployContract("KritherPaymaster", [
				registry.address,
				zeroAddress,
			]),
			paymaster,
			"InputAddressZero",
		);
	});
});

describe("KritherPaymaster - cost ceiling", async function () {
	it("lets the admin cap what one operation may cost", async function () {
		const { paymaster, admin } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await paymaster.write.setMaxCostPerOp([parseEther("0.05")], {
			account: admin.account,
		});

		assert.equal(await paymaster.read.maxCostPerOp(), parseEther("0.05"));
	});

	it("emits MaxCostPerOpSet carrying the new ceiling", async function () {
		const { paymaster, admin } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await viem.assertions.emitWithArgs(
			paymaster.write.setMaxCostPerOp([parseEther("0.05")], {
				account: admin.account,
			}),
			paymaster,
			"MaxCostPerOpSet",
			[parseEther("0.05")],
		);
	});

	it("refuses a ceiling set by an account without PAYMASTER_ROLE", async function () {
		const { paymaster, producer1 } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.setMaxCostPerOp([parseEther("0.05")], {
				account: producer1.account,
			}),
			paymaster,
			"NotAccredited",
		);
	});
});

describe("KritherPaymaster - sponsorship role", async function () {
	it("refuses the registry admin that was never given PAYMASTER_ROLE", async function () {
		const { subscriptions, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setMaxCostPerOp([MAX_COST_PER_OP], {
				account: admin.account,
			}),
			subscriptions,
			"NotAccredited",
		);
	});

	it("lets a PAYMASTER_ROLE holder that is not the registry admin run the sponsorship", async function () {
		const { subscriptions, registry, admin, other } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PAYMASTER_ROLE = await subscriptions.read.PAYMASTER_ROLE();
		await registry.write.grantRole([PAYMASTER_ROLE, other.account.address], {
			account: admin.account,
		});

		await subscriptions.write.setMaxCostPerOp([MAX_COST_PER_OP], {
			account: other.account,
		});

		assert.equal(await subscriptions.read.maxCostPerOp(), MAX_COST_PER_OP);
	});

	it("leaves taking money out to the registry admin", async function () {
		const { paymaster, registry, admin, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		const PAYMASTER_ROLE = await paymaster.read.PAYMASTER_ROLE();
		await registry.write.grantRole([PAYMASTER_ROLE, other.account.address], {
			account: admin.account,
		});

		for (const withdrawal of [
			paymaster.write.withdrawFromEntryPoint(
				[other.account.address, PAYMASTER_DEPOSIT],
				{ account: other.account },
			),
			paymaster.write.withdrawStake([other.account.address], {
				account: other.account,
			}),
			paymaster.write.withdrawRevenue(
				[other.account.address, PLAN_PRICE],
				{ account: other.account },
			),
		]) {
			await viem.assertions.revertWithCustomError(
				withdrawal,
				paymaster,
				"NotAccredited",
			);
		}
	});

	it("leaves opening a plan to the registry admin", async function () {
		const { subscriptions, registry, admin, other } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PAYMASTER_ROLE = await subscriptions.read.PAYMASTER_ROLE();
		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();
		await registry.write.grantRole([PAYMASTER_ROLE, other.account.address], {
			account: admin.account,
		});

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
				{ account: other.account },
			),
			subscriptions,
			"NotAccredited",
		);
	});
});

describe("KritherPaymaster - sponsorship scope", async function () {
	it("lets the admin open another Krither contract", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await paymaster.write.setSponsoredTarget(
			[other.account.address, true],
			{ account: admin.account },
		);

		assert.equal(
			await paymaster.read.sponsoredTargets([other.account.address]),
			true,
		);
	});

	it("lets the admin close a contract again", async function () {
		const { paymaster, registry, admin } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await paymaster.write.setSponsoredTarget([registry.address, false], {
			account: admin.account,
		});

		assert.equal(
			await paymaster.read.sponsoredTargets([registry.address]),
			false,
		);
	});

	it("emits SponsoredTargetSet on both", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await viem.assertions.emitWithArgs(
			paymaster.write.setSponsoredTarget([other.account.address, true], {
				account: admin.account,
			}),
			paymaster,
			"SponsoredTargetSet",
			[
				(a: string) =>
					a.toLowerCase() === other.account.address.toLowerCase(),
				true,
			],
		);
	});

	it("refuses opening a contract from an account without PAYMASTER_ROLE", async function () {
		const { paymaster, producer1, other } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.setSponsoredTarget([other.account.address, true], {
				account: producer1.account,
			}),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses opening the zero address", async function () {
		const { paymaster, admin } =
			await networkHelpers.loadFixture(deployMockedPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.setSponsoredTarget([zeroAddress, true], {
				account: admin.account,
			}),
			paymaster,
			"InputAddressZero",
		);
	});
});

describe("KritherPaymaster - gas budget", async function () {
	it("reports the budget it holds at the EntryPoint", async function () {
		const { paymaster } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		assert.equal(await paymaster.read.entryPointBalance(), PAYMASTER_DEPOSIT);
	});

	it("moves subscription revenue into the budget", async function () {
		const { paymaster, admin } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		const publicClient = await viem.getPublicClient();

		await paymaster.write.depositToEntryPoint([PLAN_PRICE], {
			account: admin.account,
		});

		assert.equal(
			await paymaster.read.entryPointBalance(),
			PAYMASTER_DEPOSIT + PLAN_PRICE,
		);
		assert.equal(
			await publicClient.getBalance({ address: paymaster.address }),
			0n,
		);
	});

	it("opens the budget out of the caller's own funds", async function () {
		const { paymaster, admin } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await paymaster.write.depositToEntryPoint([PLAN_PRICE], {
			account: admin.account,
			value: PLAN_PRICE,
		});

		assert.equal(
			await paymaster.read.entryPointBalance(),
			PAYMASTER_DEPOSIT + PLAN_PRICE,
		);
	});

	it("emits FundsDeposited splitting what was sent from what was held", async function () {
		const { paymaster, admin } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		// half out of the caller's pocket, half out of a subscription already
		// paid for, so both halves of the event carry a figure
		await viem.assertions.emitWithArgs(
			paymaster.write.depositToEntryPoint([PLAN_PRICE * 2n], {
				account: admin.account,
				value: PLAN_PRICE,
			}),
			paymaster,
			"FundsDeposited",
			[
				"deposit",
				(a: string) => a.toLowerCase() === admin.account.address.toLowerCase(),
				PLAN_PRICE,
				PLAN_PRICE,
			],
		);
	});

	it("reports a deposit taken entirely out of revenue as held", async function () {
		const { paymaster, admin } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.emitWithArgs(
			paymaster.write.depositToEntryPoint([PLAN_PRICE], {
				account: admin.account,
			}),
			paymaster,
			"FundsDeposited",
			[
				"deposit",
				(a: string) => a.toLowerCase() === admin.account.address.toLowerCase(),
				0n,
				PLAN_PRICE,
			],
		);
	});

	it("refuses moving more revenue than it holds", async function () {
		const { paymaster, admin } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.revert(
			paymaster.write.depositToEntryPoint([PLAN_PRICE + 1n], {
				account: admin.account,
			}),
		);
	});

	it("refuses a deposit from an account without PAYMASTER_ROLE", async function () {
		const { paymaster, producer1 } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.revertWithCustomError(
			paymaster.write.depositToEntryPoint([PLAN_PRICE], {
				account: producer1.account,
			}),
			paymaster,
			"NotAccredited",
		);
	});

	it("takes the budget back out to a wallet", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.balancesHaveChanged(
			paymaster.write.withdrawFromEntryPoint(
				[other.account.address, PAYMASTER_DEPOSIT],
				{ account: admin.account },
			),
			[{ address: other.account.address, amount: PAYMASTER_DEPOSIT }],
		);

		assert.equal(await paymaster.read.entryPointBalance(), 0n);
	});

	it("emits FundsWithdrawn naming the deposit it came out of", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.emitWithArgs(
			paymaster.write.withdrawFromEntryPoint(
				[other.account.address, PAYMASTER_DEPOSIT],
				{ account: admin.account },
			),
			paymaster,
			"FundsWithdrawn",
			[
				"deposit",
				(a: string) =>
					a.toLowerCase() === other.account.address.toLowerCase(),
				PAYMASTER_DEPOSIT,
			],
		);
	});

	it("refuses a budget withdrawal from an account without DEFAULT_ADMIN_ROLE", async function () {
		const { paymaster, producer1, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawFromEntryPoint(
				[other.account.address, PAYMASTER_DEPOSIT],
				{ account: producer1.account },
			),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses a budget withdrawal to the zero address", async function () {
		const { paymaster, admin } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawFromEntryPoint([zeroAddress, 1n], {
				account: admin.account,
			}),
			paymaster,
			"InputAddressZero",
		);
	});
});

describe("KritherPaymaster - stake", async function () {
	it("stakes the paymaster, which bundlers require", async function () {
		const { paymaster, entryPoint } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		const info = await entryPoint.read.getDepositInfo([paymaster.address]);

		assert.equal(info.staked, true);
		assert.equal(info.stake, PAYMASTER_STAKE);
		assert.equal(info.unstakeDelaySec, UNSTAKE_DELAY);
	});

	it("emits FundsDeposited naming the stake it went into", async function () {
		const { paymaster, admin } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.emitWithArgs(
			paymaster.write.addStake([UNSTAKE_DELAY], {
				account: admin.account,
				value: PAYMASTER_STAKE,
			}),
			paymaster,
			"FundsDeposited",
			[
				"stake",
				(a: string) => a.toLowerCase() === admin.account.address.toLowerCase(),
				PAYMASTER_STAKE,
				0n,
			],
		);
	});

	it("refuses a stake from an account without PAYMASTER_ROLE", async function () {
		const { paymaster, producer1 } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.addStake([UNSTAKE_DELAY], {
				account: producer1.account,
				value: PAYMASTER_STAKE,
			}),
			paymaster,
			"NotAccredited",
		);
	});

	it("unlocks the stake, starting the delay", async function () {
		const { paymaster, entryPoint, admin } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await paymaster.write.unlockStake({ account: admin.account });

		const info = await entryPoint.read.getDepositInfo([paymaster.address]);

		assert.equal(info.staked, false);
		assert.equal(info.withdrawTime > 0, true);
	});

	it("refuses unlocking from an account without PAYMASTER_ROLE", async function () {
		const { paymaster, producer1 } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await viem.assertions.revertWithCustomError(
			paymaster.write.unlockStake({ account: producer1.account }),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses withdrawing a stake still inside its delay", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await paymaster.write.unlockStake({ account: admin.account });

		await viem.assertions.revert(
			paymaster.write.withdrawStake([other.account.address], {
				account: admin.account,
			}),
		);
	});

	it("withdraws the stake once the delay has passed", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await paymaster.write.unlockStake({ account: admin.account });
		await networkHelpers.time.increase(UNSTAKE_DELAY + 1);

		await viem.assertions.balancesHaveChanged(
			paymaster.write.withdrawStake([other.account.address], {
				account: admin.account,
			}),
			[{ address: other.account.address, amount: PAYMASTER_STAKE }],
		);
	});

	it("emits FundsWithdrawn carrying the stake the EntryPoint sent", async function () {
		const { paymaster, admin, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await paymaster.write.unlockStake({ account: admin.account });
		await networkHelpers.time.increase(UNSTAKE_DELAY + 1);

		// the call carries no amount, so the event reports what the paymaster
		// read back off the EntryPoint before emptying it
		await viem.assertions.emitWithArgs(
			paymaster.write.withdrawStake([other.account.address], {
				account: admin.account,
			}),
			paymaster,
			"FundsWithdrawn",
			[
				"stake",
				(a: string) =>
					a.toLowerCase() === other.account.address.toLowerCase(),
				PAYMASTER_STAKE,
			],
		);
	});

	it("refuses a stake withdrawal from an account without DEFAULT_ADMIN_ROLE", async function () {
		const { paymaster, admin, producer1, other } =
			await networkHelpers.loadFixture(deployRealPaymaster);

		await paymaster.write.unlockStake({ account: admin.account });
		await networkHelpers.time.increase(UNSTAKE_DELAY + 1);

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawStake([other.account.address], {
				account: producer1.account,
			}),
			paymaster,
			"NotAccredited",
		);
	});
});

describe("KritherPaymaster - revenue", async function () {
	it("lets the admin take subscription revenue out", async function () {
		const { paymaster, admin, other } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.balancesHaveChanged(
			paymaster.write.withdrawRevenue(
				[other.account.address, PLAN_PRICE],
				{ account: admin.account },
			),
			[{ address: other.account.address, amount: PLAN_PRICE }],
		);
	});

	it("emits FundsWithdrawn naming the revenue it came out of", async function () {
		const { paymaster, admin, other } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.emitWithArgs(
			paymaster.write.withdrawRevenue(
				[other.account.address, PLAN_PRICE],
				{ account: admin.account },
			),
			paymaster,
			"FundsWithdrawn",
			[
				"revenue",
				(a: string) =>
					a.toLowerCase() === other.account.address.toLowerCase(),
				PLAN_PRICE,
			],
		);
	});

	it("never reaches past the revenue into the gas budget", async function () {
		const { paymaster, admin, other } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawRevenue(
				[other.account.address, PLAN_PRICE + 1n],
				{ account: admin.account },
			),
			paymaster,
			"WithdrawFailed",
		);
	});

	it("refuses a withdrawal from an account without DEFAULT_ADMIN_ROLE", async function () {
		const { paymaster, producer1, other } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawRevenue(
				[other.account.address, PLAN_PRICE],
				{ account: producer1.account },
			),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses a withdrawal to the zero address", async function () {
		const { paymaster, admin } = await networkHelpers.loadFixture(
			deploySponsoredAccount,
		);

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawRevenue([zeroAddress, PLAN_PRICE], {
				account: admin.account,
			}),
			paymaster,
			"InputAddressZero",
		);
	});
});

describe("KritherPaymaster - validating an operation", async function () {
	it("accepts a subscribed producer calling the registry", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(
				registry.address,
				0n,
				encodeFunctionData({
					abi: registry.abi,
					functionName: "mintLot",
					args: [[500n], CID, REF],
				}),
			),
		});

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		assert.equal((await entryPoint.read.lastContext()).length > 2, true);
	});

	it("hands the EntryPoint a window closing with the subscription", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(
				registry.address,
				0n,
				encodeFunctionData({
					abi: registry.abi,
					functionName: "mintLot",
					args: [[500n], CID, REF],
				}),
			),
		});

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		const [, , , , , expiresAt] = await paymaster.read.subscriptions([
			producer1.account.address,
		]);

		assert.equal(
			validUntilOf(await entryPoint.read.lastValidationData()),
			expiresAt,
		);
	});

	it("accepts a batch that stays inside Krither", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const mint = encodeFunctionData({
			abi: registry.abi,
			functionName: "mintLot",
			args: [[500n], CID, REF],
		});
		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeBatch([
				{ target: registry.address, value: 0n, data: mint },
				{ target: registry.address, value: 0n, data: mint },
			]),
		});

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		assert.equal((await entryPoint.read.lastContext()).length > 2, true);
	});

	it("refuses a caller that is not the EntryPoint", async function () {
		const { paymaster, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		// validation is a view function, so anyone may call it; the guard is
		// what stops a caller other than the EntryPoint getting a verdict
		await viem.assertions.revertWithCustomError(
			paymaster.read.validatePaymasterUserOp(
				[userOp, USER_OP_HASH, MAX_COST_PER_OP],
				{ account: producer1.account.address },
			),
			paymaster,
			"NotEntryPoint",
		);
	});

	it("refuses a target outside Krither", async function () {
		const { paymaster, entryPoint, producer1, other } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(other.account.address, 0n, "0x"),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"TargetNotAllowed",
		);
	});

	it("refuses a batch where one call leaves Krither", async function () {
		const { paymaster, entryPoint, registry, producer1, other } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const mint = encodeFunctionData({
			abi: registry.abi,
			functionName: "mintLot",
			args: [[500n], CID, REF],
		});
		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeBatch([
				{ target: registry.address, value: 0n, data: mint },
				{ target: other.account.address, value: 0n, data: "0x" },
			]),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"TargetNotAllowed",
		);
	});

	it("refuses a call shape it cannot read a target out of", async function () {
		const { paymaster, entryPoint, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: unsupportedCall(),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"CallShapeUnsupported",
		);
	});

	it("refuses an operation costing more than the ceiling", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP + 1n,
			]),
			paymaster,
			"CostTooHigh",
		);
	});

	it("refuses an account that never subscribed", async function () {
		const { paymaster, entryPoint, registry, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer2.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"SubscriptionExpired",
		);
	});

	it("hands the EntryPoint a closed window once the subscription has expired", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		const [, , , , , expiresAt] = await paymaster.read.subscriptions([
			producer1.account.address,
		]);
		const { timestamp } = await (
			await viem.getPublicClient()
		).getBlock();

		// the paymaster cannot read the clock, so an expired subscription is
		// refused by the window it hands back, not by a revert
		assert.equal(
			validUntilOf(await entryPoint.read.lastValidationData()),
			expiresAt,
		);
		assert.equal(expiresAt < timestamp, true);
	});

	it("holds an account that has spent its quota until the window refills", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSingleOpSubscriber);

		// a second window, so the quota has something left to refill against
		await paymaster.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		const [, , , , periodEnd] = await paymaster.read.subscriptions([
			producer1.account.address,
		]);

		assert.equal(
			validAfterOf(await entryPoint.read.lastValidationData()),
			periodEnd,
		);
	});

	it("refuses an account that has spent the quota of its last window", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSingleOpSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"QuotaExhausted",
		);
	});

	it("refuses an account whose accreditation was revoked", async function () {
		const { paymaster, entryPoint, registry, admin, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();
		await registry.write.revokeRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"NotAccredited",
		);
	});
});

describe("KritherPaymaster - settling an operation", async function () {
	it("books one transaction against the quota", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			MONTHLY_QUOTA - 1,
		);
	});

	it("emits OperationSponsored with what is left", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await viem.assertions.emitWithArgs(
			entryPoint.write.sponsor([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_SUCCEEDED,
				ACTUAL_GAS_COST,
			]),
			paymaster,
			"OperationSponsored",
			[
				(a: string) =>
					a.toLowerCase() === producer1.account.address.toLowerCase(),
				ACTUAL_GAS_COST,
				MONTHLY_QUOTA - 1,
			],
		);
	});

	it("books an operation that reverted, since the gas was still spent", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_REVERTED,
			ACTUAL_GAS_COST,
		]);

		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			MONTHLY_QUOTA - 1,
		);
	});

	it("opens a fresh window once the period has rolled", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		// a second window, so the subscription outlives the first one
		await paymaster.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});
		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			MONTHLY_QUOTA - 1,
		);
	});

	it("never opens a window outliving the subscription paying for it", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		// a second window, then a roll late enough that a full period would
		// land past the day the subscription runs out
		await paymaster.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});
		await networkHelpers.time.increase(MONTHLY_PERIOD * 1.5);

		await entryPoint.write.sponsor([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		const [, , , , periodEnd, expiresAt] = await paymaster.read.subscriptions([
			producer1.account.address,
		]);

		assert.equal(periodEnd <= expiresAt, true);
	});

	it("hands a renewal the full quota, never what the last subscription spent", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await paymaster.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});
		await networkHelpers.time.increase(MONTHLY_PERIOD * 1.5);

		for (const mode of [OP_SUCCEEDED, OP_SUCCEEDED]) {
			await entryPoint.write.sponsor([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
				mode,
				ACTUAL_GAS_COST,
			]);
		}

		// the subscription runs out while an unclamped window would still be open
		await networkHelpers.time.increase(MONTHLY_PERIOD * 0.6);
		await paymaster.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});

		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			MONTHLY_QUOTA,
		);
	});

	it("settles two operations a bundle validated against one allowance", async function () {
		const { paymaster, entryPoint, registry, producer1 } =
			await networkHelpers.loadFixture(deployMockedSingleOpSubscriber);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		// the EntryPoint validates a whole bundle before executing any of it,
		// so both operations pass against the single transaction on sale
		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const first = await entryPoint.read.lastContext();

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const second = await entryPoint.read.lastContext();

		for (const context of [first, second]) {
			await entryPoint.write.settle([
				paymaster.address,
				OP_SUCCEEDED,
				context,
				ACTUAL_GAS_COST,
				ACTUAL_FEE_PER_GAS,
			]);
		}

		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			0,
		);
	});

	it("refuses a caller that is not the EntryPoint", async function () {
		const { paymaster, producer1 } = await networkHelpers.loadFixture(
			deployMockedSubscriber,
		);

		await viem.assertions.revertWithCustomError(
			paymaster.write.postOp(
				[OP_SUCCEEDED, "0x00", ACTUAL_GAS_COST, ACTUAL_FEE_PER_GAS],
				{ account: producer1.account },
			),
			paymaster,
			"NotEntryPoint",
		);
	});
});

describe("KritherPaymaster - onboarding", async function () {
	/** The one operation an account gets before it holds a subscription */
	const onboardingOp = (
		sender: `0x${string}`,
		paymaster: `0x${string}`,
		planId = 0,
	) =>
		buildUserOp({
			sender,
			paymaster,
			paymasterData: ONBOARDING_LANE,
			callData: executeCall(
				paymaster,
				PLAN_PRICE,
				encodeFunctionData({
					abi: [
						{
							type: "function",
							name: "subscribe",
							inputs: [{ name: "planId", type: "uint8" }],
							outputs: [],
							stateMutability: "payable",
						},
					] as const,
					functionName: "subscribe",
					args: [planId],
				}),
			),
		});

	it("sponsors a first subscription from an accredited account holding none", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		assert.equal((await entryPoint.read.lastContext()).length > 2, true);
	});

	it("refuses a free operation to an account Krither never accredited", async function () {
		const { paymaster, entryPoint, other } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				onboardingOp(other.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses a free operation buying a plan sold against another role", async function () {
		const { paymaster, registry, entryPoint, admin, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const RESELLER_ROLE = await registry.read.RESELLER_ROLE();
		await paymaster.write.addPlan(
			[RESELLER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
			{ account: admin.account },
		);

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address, 1),
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses a free operation naming a plan that was never created", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address, 7),
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"PlanUnknown",
		);
	});

	it("emits OnboardingSponsored once the purchase lands", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const context = await entryPoint.read.lastContext();

		await paymaster.write.subscribe([0], {
			account: producer2.account,
			value: PLAN_PRICE,
		});

		await viem.assertions.emitWithArgs(
			entryPoint.write.settle([
				paymaster.address,
				OP_SUCCEEDED,
				context,
				ACTUAL_GAS_COST,
				ACTUAL_FEE_PER_GAS,
			]),
			paymaster,
			"OnboardingSponsored",
			[
				(a: string) =>
					a.toLowerCase() === producer2.account.address.toLowerCase(),
				ACTUAL_GAS_COST,
			],
		);
	});

	it("emits OnboardingFailed with the free operations left", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await viem.assertions.emitWithArgs(
			entryPoint.write.sponsor([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_REVERTED,
				ACTUAL_GAS_COST,
			]),
			paymaster,
			"OnboardingFailed",
			[
				(a: string) =>
					a.toLowerCase() === producer2.account.address.toLowerCase(),
				ACTUAL_GAS_COST,
				BigInt(MAX_FREE_OPS - 1),
			],
		);
	});

	it("reports no free operations left once the cap is reached", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		for (let attempt = 0; attempt < MAX_FREE_OPS - 1; attempt += 1) {
			await entryPoint.write.sponsor([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_REVERTED,
				ACTUAL_GAS_COST,
			]);
		}

		await viem.assertions.emitWithArgs(
			entryPoint.write.sponsor([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_REVERTED,
				ACTUAL_GAS_COST,
			]),
			paymaster,
			"OnboardingFailed",
			[
				(a: string) =>
					a.toLowerCase() === producer2.account.address.toLowerCase(),
				ACTUAL_GAS_COST,
				0n,
			],
		);
	});

	it("charges an attempt that left the account unsubscribed", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.sponsor([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_REVERTED,
			ACTUAL_GAS_COST,
		]);

		assert.equal(await paymaster.read.freeOps([producer2.account.address]), 1n);
	});

	it("charges it on the subscription it left behind, not the EntryPoint verdict", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.sponsor([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		assert.equal(await paymaster.read.freeOps([producer2.account.address]), 1n);
	});

	it("hands the free operations back once a plan is bought", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.sponsor([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_REVERTED,
			ACTUAL_GAS_COST,
		]);

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const context = await entryPoint.read.lastContext();

		await paymaster.write.subscribe([0], {
			account: producer2.account,
			value: PLAN_PRICE,
		});
		await entryPoint.write.settle([
			paymaster.address,
			OP_SUCCEEDED,
			context,
			ACTUAL_GAS_COST,
			ACTUAL_FEE_PER_GAS,
		]);

		assert.equal(await paymaster.read.freeOps([producer2.account.address]), 0n);
	});

	it("refuses more free operations than the cap allows, so the budget cannot be drained", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		for (let attempt = 0; attempt < MAX_FREE_OPS; attempt += 1) {
			await entryPoint.write.sponsor([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_REVERTED,
				ACTUAL_GAS_COST,
			]);
		}

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"SubscriptionExpired",
		);
	});

	it("settles two free operations a bundle validated against the same count", async function () {
		const { paymaster, entryPoint, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		for (let attempt = 0; attempt < MAX_FREE_OPS - 1; attempt += 1) {
			await entryPoint.write.sponsor([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_REVERTED,
				ACTUAL_GAS_COST,
			]);
		}

		// the EntryPoint validates a whole bundle before executing any of it,
		// so both operations pass against the single free one left
		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const first = await entryPoint.read.lastContext();

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const second = await entryPoint.read.lastContext();

		for (const context of [first, second]) {
			await entryPoint.write.settle([
				paymaster.address,
				OP_REVERTED,
				context,
				ACTUAL_GAS_COST,
				ACTUAL_FEE_PER_GAS,
			]);
		}

		assert.equal(
			await paymaster.read.freeOps([producer2.account.address]),
			BigInt(MAX_FREE_OPS),
		);
	});

	it("sponsors a renewal for an accredited account whose plan expired", async function () {
		const { paymaster, entryPoint, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer1.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		assert.equal((await entryPoint.read.lastContext()).length > 2, true);
	});

	it("holds a free operation asked for while a subscription still runs", async function () {
		const { paymaster, entryPoint, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer1.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		const [, , , , , expiresAt] = await paymaster.read.subscriptions([
			producer1.account.address,
		]);

		// the lane is the account's to ask for, but it only opens once the
		// subscription it would replace has run out
		assert.equal(
			validAfterOf(await entryPoint.read.lastValidationData()),
			expiresAt,
		);
	});

	it("charges quota, not a free operation, on a renewal a subscriber pays for", async function () {
		const { paymaster, entryPoint, producer1 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const renewal = buildUserOp({
			sender: producer1.account.address,
			paymaster: paymaster.address,
			callData: executeCall(
				paymaster.address,
				PLAN_PRICE,
				encodeFunctionData({
					abi: paymaster.abi,
					functionName: "subscribe",
					args: [0],
				}),
			),
		});

		await entryPoint.write.sponsor([
			paymaster.address,
			renewal,
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_SUCCEEDED,
			ACTUAL_GAS_COST,
		]);

		assert.equal(await paymaster.read.freeOps([producer1.account.address]), 0n);
		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			MONTHLY_QUOTA - 1,
		);
	});

	it("lets the admin hand an account its free operations back", async function () {
		const { paymaster, entryPoint, admin, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await entryPoint.write.sponsor([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
			OP_REVERTED,
			ACTUAL_GAS_COST,
		]);

		await paymaster.write.resetFreeOps([producer2.account.address], {
			account: admin.account,
		});

		assert.equal(await paymaster.read.freeOps([producer2.account.address]), 0n);
	});

	it("emits FreeOpsReset, so clearing the counter leaves a trace", async function () {
		const { paymaster, admin, producer2 } = await networkHelpers.loadFixture(
			deployMockedSubscriber,
		);

		await viem.assertions.emitWithArgs(
			paymaster.write.resetFreeOps([producer2.account.address], {
				account: admin.account,
			}),
			paymaster,
			"FreeOpsReset",
			[
				(a: string) =>
					a.toLowerCase() === producer2.account.address.toLowerCase(),
			],
		);
	});

	it("sponsors an account again once its free operations are handed back", async function () {
		const { paymaster, entryPoint, admin, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		for (let attempt = 0; attempt < MAX_FREE_OPS; attempt += 1) {
			await entryPoint.write.sponsor([
				paymaster.address,
				onboardingOp(producer2.account.address, paymaster.address),
				USER_OP_HASH,
				MAX_COST_PER_OP,
				OP_REVERTED,
				ACTUAL_GAS_COST,
			]);
		}

		await paymaster.write.resetFreeOps([producer2.account.address], {
			account: admin.account,
		});

		await entryPoint.write.validate([
			paymaster.address,
			onboardingOp(producer2.account.address, paymaster.address),
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		assert.equal((await entryPoint.read.lastContext()).length > 2, true);
	});

	it("refuses handing free operations back from an account without PAYMASTER_ROLE", async function () {
		const { paymaster, producer1, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		await viem.assertions.revertWithCustomError(
			paymaster.write.resetFreeOps([producer2.account.address], {
				account: producer1.account,
			}),
			paymaster,
			"NotAccredited",
		);
	});

	it("refuses handing free operations back to the zero address", async function () {
		const { paymaster, admin } = await networkHelpers.loadFixture(
			deployMockedSubscriber,
		);

		await viem.assertions.revertWithCustomError(
			paymaster.write.resetFreeOps([zeroAddress], {
				account: admin.account,
			}),
			paymaster,
			"InputAddressZero",
		);
	});

	it("refuses a free operation aimed anywhere but a subscription", async function () {
		const { paymaster, entryPoint, registry, producer2 } =
			await networkHelpers.loadFixture(deployMockedSubscriber);

		const userOp = buildUserOp({
			sender: producer2.account.address,
			paymaster: paymaster.address,
			paymasterData: ONBOARDING_LANE,
			callData: executeCall(
				registry.address,
				0n,
				encodeFunctionData({
					abi: registry.abi,
					functionName: "mintLot",
					args: [[500n], CID, REF],
				}),
			),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"SubscriptionExpired",
		);
	});
});

describe("KritherPaymaster - pause (SecOps)", async function () {
	it("refuses to validate an operation while paused", async function () {
		const { paymaster, entryPoint, registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await viem.assertions.revertWithCustomError(
			entryPoint.write.validate([
				paymaster.address,
				userOp,
				USER_OP_HASH,
				MAX_COST_PER_OP,
			]),
			paymaster,
			"EnforcedPause",
		);
	});

	it("still settles an operation validated before the freeze", async function () {
		const { paymaster, entryPoint, registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployMockedForPause);

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);
		const context = await entryPoint.read.lastContext();

		await paymaster.write.pause({ account: pauser.account });

		await entryPoint.write.settle([
			paymaster.address,
			OP_SUCCEEDED,
			context,
			ACTUAL_GAS_COST,
			ACTUAL_FEE_PER_GAS,
		]);

		assert.equal(
			await paymaster.read.remainingQuota([producer1.account.address]),
			MONTHLY_QUOTA - 1,
		);
	});

	it("freezes the cost ceiling", async function () {
		const { paymaster, admin, pauser } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			paymaster.write.setMaxCostPerOp([1n], { account: admin.account }),
			paymaster,
			"EnforcedPause",
		);
	});

	it("freezes the sponsorship scope", async function () {
		const { paymaster, admin, pauser, other } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			paymaster.write.setSponsoredTarget([other.account.address, true], {
				account: admin.account,
			}),
			paymaster,
			"EnforcedPause",
		);
	});

	it("freezes handing free operations back", async function () {
		const { paymaster, admin, pauser, producer2 } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			paymaster.write.resetFreeOps([producer2.account.address], {
				account: admin.account,
			}),
			paymaster,
			"EnforcedPause",
		);
	});

	it("freezes moving revenue into the gas budget", async function () {
		const { paymaster, admin, pauser } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			paymaster.write.depositToEntryPoint([PLAN_PRICE], {
				account: admin.account,
			}),
			paymaster,
			"EnforcedPause",
		);
	});

	it("freezes taking revenue out", async function () {
		const { paymaster, admin, pauser, other } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			paymaster.write.withdrawRevenue([other.account.address, PLAN_PRICE], {
				account: admin.account,
			}),
			paymaster,
			"EnforcedPause",
		);
	});

	it("resumes sponsoring after unpause", async function () {
		const { paymaster, entryPoint, registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployMockedForPause);

		await paymaster.write.pause({ account: pauser.account });
		await paymaster.write.unpause({ account: pauser.account });

		const userOp = buildUserOp({
			sender: producer1.account.address,
			callData: executeCall(registry.address, 0n, "0x"),
		});

		await entryPoint.write.validate([
			paymaster.address,
			userOp,
			USER_OP_HASH,
			MAX_COST_PER_OP,
		]);

		assert.equal((await entryPoint.read.lastContext()).length > 2, true);
	});
});

describe("KritherPaymaster - end to end", async function () {
	it("signs for the smart account with the wallet that owns it", async function () {
		const { producer1 } = await networkHelpers.loadFixture(
			deployUnsubscribedAccount,
		);

		assert.equal(
			accountOwner.address.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
	});

	it("mints a lot for a subscribed producer that spends nothing", async function () {
		const { paymaster, entryPoint, registry, account, other } =
			await networkHelpers.loadFixture(deploySponsoredAccount);

		const publicClient = await viem.getPublicClient();
		const balanceBefore = await publicClient.getBalance({
			address: account.address,
		});

		const userOp = await signUserOp(
			entryPoint,
			accountOwner,
			buildUserOp({
				sender: account.address,
				nonce: await entryPoint.read.getNonce([account.address, 0n]),
				callData: executeCall(
					registry.address,
					0n,
					encodeFunctionData({
						abi: registry.abi,
						functionName: "mintLot",
						args: [[500n], CID, REF],
					}),
				),
				paymaster: paymaster.address,
			}),
		);

		await entryPoint.write.handleOps([[userOp], other.account.address]);

		assert.equal(
			await registry.read.balanceOf([account.address, item(1n, 0n)]),
			500n,
		);
		assert.equal(
			await publicClient.getBalance({ address: account.address }),
			balanceBefore,
		);
	});

	it("pays for that operation out of its own gas budget", async function () {
		const { paymaster, entryPoint, registry, account, other } =
			await networkHelpers.loadFixture(deploySponsoredAccount);

		const userOp = await signUserOp(
			entryPoint,
			accountOwner,
			buildUserOp({
				sender: account.address,
				nonce: await entryPoint.read.getNonce([account.address, 0n]),
				callData: executeCall(
					registry.address,
					0n,
					encodeFunctionData({
						abi: registry.abi,
						functionName: "mintLot",
						args: [[500n], CID, REF],
					}),
				),
				paymaster: paymaster.address,
			}),
		);

		await entryPoint.write.handleOps([[userOp], other.account.address]);

		assert.equal(
			(await paymaster.read.entryPointBalance()) < PAYMASTER_DEPOSIT,
			true,
		);
	});

	it("charges that operation one transaction of quota", async function () {
		const { paymaster, entryPoint, registry, account, other } =
			await networkHelpers.loadFixture(deploySponsoredAccount);

		const userOp = await signUserOp(
			entryPoint,
			accountOwner,
			buildUserOp({
				sender: account.address,
				nonce: await entryPoint.read.getNonce([account.address, 0n]),
				callData: executeCall(
					registry.address,
					0n,
					encodeFunctionData({
						abi: registry.abi,
						functionName: "mintLot",
						args: [[500n], CID, REF],
					}),
				),
				paymaster: paymaster.address,
			}),
		);

		await entryPoint.write.handleOps([[userOp], other.account.address]);

		assert.equal(
			await paymaster.read.remainingQuota([account.address]),
			MONTHLY_QUOTA - 1,
		);
	});

	it("buys a first plan gas-free for an account holding no subscription", async function () {
		const { paymaster, entryPoint, account, other } =
			await networkHelpers.loadFixture(deployUnsubscribedAccount);

		const userOp = await signUserOp(
			entryPoint,
			accountOwner,
			buildUserOp({
				sender: account.address,
				nonce: await entryPoint.read.getNonce([account.address, 0n]),
				callData: executeCall(
					paymaster.address,
					PLAN_PRICE,
					encodeFunctionData({
						abi: paymaster.abi,
						functionName: "subscribe",
						args: [0],
					}),
				),
				paymaster: paymaster.address,
				paymasterData: ONBOARDING_LANE,
			}),
		);

		await entryPoint.write.handleOps([[userOp], other.account.address]);

		assert.equal(
			await paymaster.read.remainingQuota([account.address]),
			MONTHLY_QUOTA,
		);
		assert.equal(await paymaster.read.freeOps([account.address]), 0n);
	});

	it("renews gas-free once that plan has expired", async function () {
		const { paymaster, entryPoint, account, producer1, other } =
			await networkHelpers.loadFixture(deployUnsubscribedAccount);

		await producer1.sendTransaction({
			to: account.address,
			value: PLAN_PRICE,
		});

		const publicClient = await viem.getPublicClient();
		const balanceBefore = await publicClient.getBalance({
			address: account.address,
		});

		const subscribeOp = async () =>
			signUserOp(
				entryPoint,
				accountOwner,
				buildUserOp({
					sender: account.address,
					nonce: await entryPoint.read.getNonce([account.address, 0n]),
					callData: executeCall(
						paymaster.address,
						PLAN_PRICE,
						encodeFunctionData({
							abi: paymaster.abi,
							functionName: "subscribe",
							args: [0],
						}),
					),
					paymaster: paymaster.address,
					paymasterData: ONBOARDING_LANE,
				}),
			);

		await entryPoint.write.handleOps([
			[await subscribeOp()],
			other.account.address,
		]);

		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		await entryPoint.write.handleOps([
			[await subscribeOp()],
			other.account.address,
		]);

		assert.equal(
			await paymaster.read.remainingQuota([account.address]),
			MONTHLY_QUOTA,
		);
		assert.equal(
			await publicClient.getBalance({ address: account.address }),
			balanceBefore - PLAN_PRICE * 2n,
		);
	});

	it("refuses a free operation while the plan it would replace still runs", async function () {
		const { paymaster, entryPoint, account, producer1, other } =
			await networkHelpers.loadFixture(deploySponsoredAccount);

		await producer1.sendTransaction({
			to: account.address,
			value: PLAN_PRICE,
		});

		const userOp = await signUserOp(
			entryPoint,
			accountOwner,
			buildUserOp({
				sender: account.address,
				nonce: await entryPoint.read.getNonce([account.address, 0n]),
				callData: executeCall(
					paymaster.address,
					PLAN_PRICE,
					encodeFunctionData({
						abi: paymaster.abi,
						functionName: "subscribe",
						args: [0],
					}),
				),
				paymaster: paymaster.address,
				paymasterData: ONBOARDING_LANE,
			}),
		);

		// the paymaster reads no clock, so it is the EntryPoint that holds the
		// operation to the window the free lane opens in
		await viem.assertions.revertWithCustomErrorWithArgs(
			entryPoint.write.handleOps([[userOp], other.account.address]),
			entryPoint,
			"FailedOp",
			[0n, "AA32 paymaster expired or not due"],
		);
	});

	it("refuses an account with neither a subscription nor a free operation", async function () {
		const { paymaster, entryPoint, registry, account, other } =
			await networkHelpers.loadFixture(deployUnsubscribedAccount);

		const userOp = await signUserOp(
			entryPoint,
			accountOwner,
			buildUserOp({
				sender: account.address,
				nonce: await entryPoint.read.getNonce([account.address, 0n]),
				callData: executeCall(
					registry.address,
					0n,
					encodeFunctionData({
						abi: registry.abi,
						functionName: "mintLot",
						args: [[500n], CID, REF],
					}),
				),
				paymaster: paymaster.address,
			}),
		);

		await viem.assertions.revertWithCustomErrorWithArgs(
			entryPoint.write.handleOps([[userOp], other.account.address]),
			entryPoint,
			"FailedOpWithRevert",
			[0n, "AA33 reverted", () => true],
		);
	});
});
