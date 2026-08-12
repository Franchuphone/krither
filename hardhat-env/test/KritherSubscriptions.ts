import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { zeroAddress } from "viem";

import {
	MONTHLY_PERIOD,
	MONTHLY_QUOTA,
	PLAN_PRICE,
	anyTimestamp,
	deployAccreditedSubscriber,
	deploySubscribed,
	deploySubscriptions,
	deploySubscriptionsForPause,
	deployWithProducerPlan,
	networkHelpers,
	viem,
} from "./helpers/fixtures.js";

describe("KritherSubscriptions - deployment", async function () {
	it("wires the paymaster to the registry it prices access to", async function () {
		const { subscriptions, registry } =
			await networkHelpers.loadFixture(deploySubscriptions);

		assert.equal(
			(await subscriptions.read.registry()).toLowerCase(),
			registry.address.toLowerCase(),
		);
	});

	it("starts with no plan on sale", async function () {
		const { subscriptions } =
			await networkHelpers.loadFixture(deploySubscriptions);

		assert.equal(await subscriptions.read.planCount(), 0n);
	});

	it("reverts when deployed with the zero address as registry", async function () {
		const { subscriptions } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			viem.deployContract("KritherPaymaster", [zeroAddress]),
			subscriptions,
			"InputAddressZero",
		);
	});
});

describe("KritherSubscriptions - adding plans", async function () {
	it("lets the admin open the monthly producer plan", async function () {
		const { subscriptions, registry } = await networkHelpers.loadFixture(
			deployWithProducerPlan,
		);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();
		const [role, price, quota, period, enabled] =
			await subscriptions.read.planTerms([0]);

		assert.equal(await subscriptions.read.planCount(), 1n);
		assert.equal(role, PRODUCER_ROLE);
		assert.equal(price, PLAN_PRICE);
		assert.equal(quota, MONTHLY_QUOTA);
		assert.equal(period, MONTHLY_PERIOD);
		assert.equal(enabled, true);
	});

	it("returns the id of the plan it created", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		const { result } = await subscriptions.simulate.addPlan(
			[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
			{ account: admin.account.address },
		);

		assert.equal(result, 0);
	});

	it("emits PlanSet carrying the terms it opened", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.emitWithArgs(
			subscriptions.write.addPlan(
				[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
				{ account: admin.account },
			),
			subscriptions,
			"PlanSet",
			[0, PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD, true],
		);
	});

	it("numbers plans in creation order", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deployWithProducerPlan);

		const RESELLER_ROLE = await registry.read.RESELLER_ROLE();

		await subscriptions.write.addPlan(
			[RESELLER_ROLE, PLAN_PRICE, 250, MONTHLY_PERIOD],
			{ account: admin.account },
		);

		const [role, , quota] = await subscriptions.read.planTerms([1]);

		assert.equal(await subscriptions.read.planCount(), 2n);
		assert.equal(role, RESELLER_ROLE);
		assert.equal(quota, 250);
	});

	it("refuses a plan added by an account without DEFAULT_ADMIN_ROLE", async function () {
		const { subscriptions, registry, producer1 } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
				{ account: producer1.account },
			),
			subscriptions,
			"NotAccredited",
		);
	});

	it("refuses a plan selling no transactions", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[PRODUCER_ROLE, PLAN_PRICE, 0, MONTHLY_PERIOD],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});

	it("refuses a plan lasting no time", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, 0],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});
});

describe("KritherSubscriptions - updating plans", async function () {
	it("lets the admin reprice, reshape and retire a plan", async function () {
		const { subscriptions, admin } = await networkHelpers.loadFixture(
			deployWithProducerPlan,
		);

		await subscriptions.write.setPlan(
			[0, PLAN_PRICE * 2n, 2000, MONTHLY_PERIOD * 2, false],
			{ account: admin.account },
		);

		const [, price, quota, period, enabled] =
			await subscriptions.read.planTerms([0]);

		assert.equal(price, PLAN_PRICE * 2n);
		assert.equal(quota, 2000);
		assert.equal(period, MONTHLY_PERIOD * 2);
		assert.equal(enabled, false);
	});

	it("emits PlanSet on update", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deployWithProducerPlan);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.emitWithArgs(
			subscriptions.write.setPlan(
				[0, PLAN_PRICE, 2000, MONTHLY_PERIOD, true],
				{ account: admin.account },
			),
			subscriptions,
			"PlanSet",
			[0, PRODUCER_ROLE, PLAN_PRICE, 2000, MONTHLY_PERIOD, true],
		);
	});

	it("never rewrites the role a plan is sold against", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deployWithProducerPlan);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await subscriptions.write.setPlan([0, 0n, 1, 1, false], {
			account: admin.account,
		});

		const [role] = await subscriptions.read.planTerms([0]);

		assert.equal(role, PRODUCER_ROLE);
	});

	it("refuses updating a plan that was never created", async function () {
		const { subscriptions, admin } = await networkHelpers.loadFixture(
			deployWithProducerPlan,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[1, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD, true],
				{ account: admin.account },
			),
			subscriptions,
			"PlanUnknown",
		);
	});

	it("refuses an update from an account without DEFAULT_ADMIN_ROLE", async function () {
		const { subscriptions, producer1 } = await networkHelpers.loadFixture(
			deployWithProducerPlan,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[0, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD, true],
				{ account: producer1.account },
			),
			subscriptions,
			"NotAccredited",
		);
	});

	it("refuses an update selling no transactions", async function () {
		const { subscriptions, admin } = await networkHelpers.loadFixture(
			deployWithProducerPlan,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[0, PLAN_PRICE, 0, MONTHLY_PERIOD, true],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});

	it("refuses an update lasting no time", async function () {
		const { subscriptions, admin } = await networkHelpers.loadFixture(
			deployWithProducerPlan,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[0, PLAN_PRICE, MONTHLY_QUOTA, 0, true],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});
});

describe("KritherSubscriptions - buying a subscription", async function () {
	it("opens one window of the plan's length carrying its full quota", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		const openedAt = await networkHelpers.time.latest();
		const [planId, quota, used, period, periodEnd, expiresAt] =
			await subscriptions.read.subscriptions([producer1.account.address]);

		assert.equal(planId, 0);
		assert.equal(quota, MONTHLY_QUOTA);
		assert.equal(period, MONTHLY_PERIOD);
		assert.equal(periodEnd, BigInt(openedAt + MONTHLY_PERIOD));
		assert.equal(expiresAt, BigInt(openedAt + MONTHLY_PERIOD));
		assert.equal(used, 0);
	});

	it("emits Subscribed with the terms it captured", async function () {
		const { subscriptions, producer1 } = await networkHelpers.loadFixture(
			deployAccreditedSubscriber,
		);

		await viem.assertions.emitWithArgs(
			subscriptions.write.subscribe([0], {
				account: producer1.account,
				value: PLAN_PRICE,
			}),
			subscriptions,
			"Subscribed",
			[
				(a: string) =>
					a.toLowerCase() === producer1.account.address.toLowerCase(),
				0,
				anyTimestamp,
				MONTHLY_QUOTA,
			],
		);
	});

	it("holds the payment in the contract", async function () {
		const { subscriptions } =
			await networkHelpers.loadFixture(deploySubscribed);

		const publicClient = await viem.getPublicClient();

		assert.equal(
			await publicClient.getBalance({ address: subscriptions.address }),
			PLAN_PRICE,
		);
	});

	it("reports the plan's full quota as remaining", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		assert.equal(
			await subscriptions.read.remainingQuota([
				producer1.account.address,
			]),
			MONTHLY_QUOTA,
		);
	});

	it("refuses a payment that does not match the plan's price", async function () {
		const { subscriptions, producer1 } = await networkHelpers.loadFixture(
			deployAccreditedSubscriber,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.subscribe([0], {
				account: producer1.account,
				value: PLAN_PRICE - 1n,
			}),
			subscriptions,
			"PriceMismatch",
		);
	});

	it("refuses an account that does not hold the plan's role", async function () {
		const { subscriptions, producer2 } = await networkHelpers.loadFixture(
			deployAccreditedSubscriber,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.subscribe([0], {
				account: producer2.account,
				value: PLAN_PRICE,
			}),
			subscriptions,
			"NotAccredited",
		);
	});

	it("refuses a plan that was never created", async function () {
		const { subscriptions, producer1 } = await networkHelpers.loadFixture(
			deployAccreditedSubscriber,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.subscribe([1], {
				account: producer1.account,
				value: PLAN_PRICE,
			}),
			subscriptions,
			"PlanUnknown",
		);
	});

	it("refuses a plan that has been retired", async function () {
		const { subscriptions, admin, producer1 } =
			await networkHelpers.loadFixture(deployAccreditedSubscriber);

		await subscriptions.write.setPlan(
			[0, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD, false],
			{ account: admin.account },
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.subscribe([0], {
				account: producer1.account,
				value: PLAN_PRICE,
			}),
			subscriptions,
			"PlanDisabled",
		);
	});
});

describe("KritherSubscriptions - renewing", async function () {
	it("appends a window without moving the one in progress", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		const [, , , , periodEndBefore, expiresAtBefore] =
			await subscriptions.read.subscriptions([producer1.account.address]);

		await subscriptions.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});

		const [, , , , periodEndAfter, expiresAtAfter] =
			await subscriptions.read.subscriptions([producer1.account.address]);

		assert.equal(periodEndAfter, periodEndBefore);
		assert.equal(expiresAtAfter, expiresAtBefore + BigInt(MONTHLY_PERIOD));
	});

	it("restarts both windows once the subscription has lapsed", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		await subscriptions.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});

		const renewedAt = await networkHelpers.time.latest();
		const [, , , , periodEnd, expiresAt] =
			await subscriptions.read.subscriptions([producer1.account.address]);

		assert.equal(periodEnd, BigInt(renewedAt + MONTHLY_PERIOD));
		assert.equal(expiresAt, BigInt(renewedAt + MONTHLY_PERIOD));
	});

	it("adopts the plan's current terms", async function () {
		const { subscriptions, admin, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		await subscriptions.write.setPlan(
			[0, PLAN_PRICE, 2000, MONTHLY_PERIOD, true],
			{ account: admin.account },
		);
		await subscriptions.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});

		const [, quota] = await subscriptions.read.subscriptions([
			producer1.account.address,
		]);

		assert.equal(quota, 2000);
	});

	it("buys twelve windows of the quota, never one pooled allowance", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		const [, , , , , expiresAtFirst] =
			await subscriptions.read.subscriptions([producer1.account.address]);

		for (let i = 0; i < 11; ++i) {
			await subscriptions.write.subscribe([0], {
				account: producer1.account,
				value: PLAN_PRICE,
			});
		}

		const [, quota, , , , expiresAt] =
			await subscriptions.read.subscriptions([producer1.account.address]);

		assert.equal(expiresAt, expiresAtFirst + BigInt(11 * MONTHLY_PERIOD));
		assert.equal(quota, MONTHLY_QUOTA);
	});
});

describe("KritherSubscriptions - windows and expiry", async function () {
	it("hands back the full quota once a window has rolled, without writing", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		// a second window, so the subscription outlives the first one
		await subscriptions.write.subscribe([0], {
			account: producer1.account,
			value: PLAN_PRICE,
		});
		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		const now = await networkHelpers.time.latest();
		const [, , , , periodEnd] = await subscriptions.read.subscriptions([
			producer1.account.address,
		]);

		// the stored window is stale, yet the view compensates for it
		assert.equal(periodEnd < BigInt(now), true);
		assert.equal(
			await subscriptions.read.remainingQuota([
				producer1.account.address,
			]),
			MONTHLY_QUOTA,
		);
	});

	it("reports nothing once the last window has closed", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscribed);

		await networkHelpers.time.increase(MONTHLY_PERIOD + 1);

		assert.equal(
			await subscriptions.read.remainingQuota([
				producer1.account.address,
			]),
			0,
		);
	});

	it("reports nothing for an account that never subscribed", async function () {
		const { subscriptions, other } =
			await networkHelpers.loadFixture(deploySubscribed);

		assert.equal(
			await subscriptions.read.remainingQuota([other.account.address]),
			0,
		);
	});
});

describe("KritherSubscriptions - pause (SecOps)", async function () {
	it("lets a PAUSER_ROLE holder pause and unpause", async function () {
		const { subscriptions, pauser } = await networkHelpers.loadFixture(
			deploySubscriptionsForPause,
		);

		await subscriptions.write.pause({ account: pauser.account });
		assert.equal(await subscriptions.read.paused(), true);

		await subscriptions.write.unpause({ account: pauser.account });
		assert.equal(await subscriptions.read.paused(), false);
	});

	it("refuses pausing from an account without PAUSER_ROLE", async function () {
		const { subscriptions, producer1 } = await networkHelpers.loadFixture(
			deploySubscriptionsForPause,
		);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.pause({ account: producer1.account }),
			subscriptions,
			"NotAccredited",
		);
	});

	it("freezes new subscriptions while paused", async function () {
		const { subscriptions, pauser, producer1 } =
			await networkHelpers.loadFixture(deploySubscriptionsForPause);

		await subscriptions.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			subscriptions.write.subscribe([0], {
				account: producer1.account,
				value: PLAN_PRICE,
			}),
			subscriptions,
			"EnforcedPause",
		);
	});

	it("resumes subscriptions after unpause", async function () {
		const { subscriptions, pauser, producer1 } =
			await networkHelpers.loadFixture(deploySubscriptionsForPause);

		await subscriptions.write.pause({ account: pauser.account });
		await subscriptions.write.unpause({ account: pauser.account });

		await viem.assertions.emit(
			subscriptions.write.subscribe([0], {
				account: producer1.account,
				value: PLAN_PRICE,
			}),
			subscriptions,
			"Subscribed",
		);
	});
});
