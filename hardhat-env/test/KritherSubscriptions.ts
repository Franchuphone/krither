import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { zeroAddress } from "viem";

import {
	MONTHLY_PERIOD,
	MONTHLY_QUOTA,
	PLAN_PRICE,
	deploySubscriptions,
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
