import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { zeroAddress } from "viem";

import {
	MONTHLY_PERIOD,
	MONTHLY_QUOTA,
	PRODUCER_PRICE,
	deploySubscriptions,
	networkHelpers,
	viem,
} from "./helpers/fixtures.js";

describe("KritherSubscriptions - deployment", async function () {
	it("seeds plan 0 with the monthly producer plan", async function () {
		const { subscriptions, registry } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();
		const [role, price, quota, period, enabled] =
			await subscriptions.read.plans([0n]);

		assert.equal(role, PRODUCER_ROLE);
		assert.equal(price, PRODUCER_PRICE);
		assert.equal(quota, MONTHLY_QUOTA);
		assert.equal(period, MONTHLY_PERIOD);
		assert.equal(enabled, true);
	});

	it("counts the seeded plan and nothing else", async function () {
		const { subscriptions } =
			await networkHelpers.loadFixture(deploySubscriptions);

		assert.equal(await subscriptions.read.planCount(), 1n);
	});

	it("announces the seeded plan through PlanSet", async function () {
		const { subscriptions, registry } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();
		const publicClient = await viem.getPublicClient();

		const logs = await publicClient.getContractEvents({
			address: subscriptions.address,
			abi: subscriptions.abi,
			eventName: "PlanSet",
			fromBlock: 0n,
		});

		assert.equal(logs.length, 1);
		assert.equal(logs[0].args.planId, 0);
		assert.equal(logs[0].args.role, PRODUCER_ROLE);
		assert.equal(logs[0].args.quota, MONTHLY_QUOTA);
	});

	it("reverts when deployed with the zero address as registry", async function () {
		const { subscriptions } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			viem.deployContract("KritherSubscriptions", [
				zeroAddress,
				PRODUCER_PRICE,
			]),
			subscriptions,
			"InputAddressZero",
		);
	});
});

describe("KritherSubscriptions - adding plans", async function () {
	it("lets the admin sell a plan to another supply-chain role", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const RESELLER_ROLE = await registry.read.RESELLER_ROLE();

		await subscriptions.write.addPlan(
			[RESELLER_ROLE, PRODUCER_PRICE, 250, MONTHLY_PERIOD],
			{ account: admin.account },
		);

		const [role, price, quota, period, enabled] =
			await subscriptions.read.plans([1n]);

		assert.equal(await subscriptions.read.planCount(), 2n);
		assert.equal(role, RESELLER_ROLE);
		assert.equal(price, PRODUCER_PRICE);
		assert.equal(quota, 250);
		assert.equal(period, MONTHLY_PERIOD);
		assert.equal(enabled, true);
	});

	it("returns the id of the plan it created", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const CONSUMER_ROLE = await registry.read.CONSUMER_ROLE();

		const { result } = await subscriptions.simulate.addPlan(
			[CONSUMER_ROLE, 0n, 10, MONTHLY_PERIOD],
			{ account: admin.account },
		);

		assert.equal(result, 1);
	});

	it("emits PlanSet carrying the new plan id", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const CONSUMER_ROLE = await registry.read.CONSUMER_ROLE();

		await viem.assertions.emitWithArgs(
			subscriptions.write.addPlan(
				[CONSUMER_ROLE, 0n, 10, MONTHLY_PERIOD],
				{ account: admin.account },
			),
			subscriptions,
			"PlanSet",
			[1, CONSUMER_ROLE, 0n, 10, MONTHLY_PERIOD, true],
		);
	});

	it("refuses a plan added by an account without DEFAULT_ADMIN_ROLE", async function () {
		const { subscriptions, registry, producer1 } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const CONSUMER_ROLE = await registry.read.CONSUMER_ROLE();

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[CONSUMER_ROLE, PRODUCER_PRICE, 10, MONTHLY_PERIOD],
				{ account: producer1.account },
			),
			subscriptions,
			"NotAccredited",
		);
	});

	it("refuses a plan selling no transactions", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const CONSUMER_ROLE = await registry.read.CONSUMER_ROLE();

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[CONSUMER_ROLE, PRODUCER_PRICE, 0, MONTHLY_PERIOD],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});

	it("refuses a plan lasting no time", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const CONSUMER_ROLE = await registry.read.CONSUMER_ROLE();

		await viem.assertions.revertWithCustomError(
			subscriptions.write.addPlan(
				[CONSUMER_ROLE, PRODUCER_PRICE, 10, 0],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});
});

describe("KritherSubscriptions - updating plans", async function () {
	it("lets the admin reprice, reshape and retire a plan", async function () {
		const { subscriptions, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await subscriptions.write.setPlan(
			[0, PRODUCER_PRICE * 2n, 2000, MONTHLY_PERIOD * 2, false],
			{ account: admin.account },
		);

		const [, price, quota, period, enabled] =
			await subscriptions.read.plans([0n]);

		assert.equal(price, PRODUCER_PRICE * 2n);
		assert.equal(quota, 2000);
		assert.equal(period, MONTHLY_PERIOD * 2);
		assert.equal(enabled, false);
	});

	it("emits PlanSet on update", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.emitWithArgs(
			subscriptions.write.setPlan(
				[0, PRODUCER_PRICE, 2000, MONTHLY_PERIOD, true],
				{ account: admin.account },
			),
			subscriptions,
			"PlanSet",
			[0, PRODUCER_ROLE, PRODUCER_PRICE, 2000, MONTHLY_PERIOD, true],
		);
	});

	it("never rewrites the role a plan is sold against", async function () {
		const { subscriptions, registry, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await subscriptions.write.setPlan(
			[0, 0n, 1, 1, false],
			{ account: admin.account },
		);

		const [role] = await subscriptions.read.plans([0n]);

		assert.equal(role, PRODUCER_ROLE);
	});

	it("refuses updating a plan that was never created", async function () {
		const { subscriptions, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[1, PRODUCER_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD, true],
				{ account: admin.account },
			),
			subscriptions,
			"PlanUnknown",
		);
	});

	it("refuses an update from an account without DEFAULT_ADMIN_ROLE", async function () {
		const { subscriptions, producer1 } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[0, PRODUCER_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD, true],
				{ account: producer1.account },
			),
			subscriptions,
			"NotAccredited",
		);
	});

	it("refuses an update selling no transactions", async function () {
		const { subscriptions, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[0, PRODUCER_PRICE, 0, MONTHLY_PERIOD, true],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});

	it("refuses an update lasting no time", async function () {
		const { subscriptions, admin } =
			await networkHelpers.loadFixture(deploySubscriptions);

		await viem.assertions.revertWithCustomError(
			subscriptions.write.setPlan(
				[0, PRODUCER_PRICE, MONTHLY_QUOTA, 0, true],
				{ account: admin.account },
			),
			subscriptions,
			"InputNumberNull",
		);
	});
});
