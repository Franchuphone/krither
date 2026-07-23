import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

const { viem, networkHelpers } = await network.create();

const CID = "bafkreialgaeseaweedharvest2026quiberon";
const NEW_CID = "bafkreiupdatedlifecyclemetadatadryingstep";

/** Deploys the registry with `admin` holding DEFAULT_ADMIN_ROLE. */
async function deployRegistry() {
	const [admin, producer, other] = await viem.getWalletClients();

	const registry = await viem.deployContract("KritherRegistry", [
		admin.account.address,
	]);

	return { registry, admin, producer, other };
}

/** Deploys the registry and accredits `producer` with PRODUCER_ROLE. */
async function deployAccredited() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/** Accredits `producer` and mints lot #1 (500 units) held by `producer`. */
async function deployWithLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([500n, CID], {
		account: fixture.producer.account,
	});

	return fixture;
}

describe("KritherRegistry — deployment", async function () {
	it("grants DEFAULT_ADMIN_ROLE to the address passed to the constructor", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployRegistry);

		const DEFAULT_ADMIN_ROLE = await registry.read.DEFAULT_ADMIN_ROLE();

		assert.equal(
			await registry.read.hasRole([
				DEFAULT_ADMIN_ROLE,
				admin.account.address,
			]),
			true,
		);
	});

	it("grants PRODUCER_ROLE to nobody at deployment", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployRegistry);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		assert.equal(
			await registry.read.hasRole([PRODUCER_ROLE, admin.account.address]),
			false,
		);
	});

	it("supports the ERC-1155 and ERC-165 interfaces", async function () {
		const { registry } = await networkHelpers.loadFixture(deployRegistry);

		// ERC-165 = 0x01ffc9a7, ERC-1155 = 0xd9b67a26
		assert.equal(
			await registry.read.supportsInterface(["0x01ffc9a7"]),
			true,
		);
		assert.equal(
			await registry.read.supportsInterface(["0xd9b67a26"]),
			true,
		);
	});
});

describe("KritherRegistry — producer accreditation", async function () {
	it("lets the admin grant and revoke PRODUCER_ROLE", async function () {
		const { registry, admin, producer } =
			await networkHelpers.loadFixture(deployRegistry);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await registry.write.grantRole(
			[PRODUCER_ROLE, producer.account.address],
			{
				account: admin.account,
			},
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer.account.address,
			]),
			true,
		);

		await registry.write.revokeRole(
			[PRODUCER_ROLE, producer.account.address],
			{
				account: admin.account,
			},
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer.account.address,
			]),
			false,
		);
	});

	it("refuses a non-admin trying to grant PRODUCER_ROLE", async function () {
		const { registry, producer, other } =
			await networkHelpers.loadFixture(deployAccredited);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.revertWithCustomError(
			registry.write.grantRole([PRODUCER_ROLE, other.account.address], {
				account: producer.account,
			}),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});
});

describe("KritherRegistry — lot creation", async function () {
	it("refuses minting from an account without PRODUCER_ROLE", async function () {
		const { registry, other } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([500n, CID], { account: other.account }),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});

	it("mints the quantity to the producer and emits LotCreated", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.emit(
			registry.write.mintLot([500n, CID], {
				account: producer.account,
			}),
			registry,
			"LotCreated",
		);

		assert.equal(
			await registry.read.balanceOf([producer.account.address, 1n]),
			500n,
		);
		const [lotProducer] = await registry.read.lots([1n]);
		assert.equal(
			lotProducer.toLowerCase(),
			producer.account.address.toLowerCase(),
		);
	});

	it("rejects a mint with zero quantity", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([0n, CID], { account: producer.account }),
			registry,
			"InputNumberNull",
		);
	});

	it("rejects a mint with an empty CID", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([500n, ""], { account: producer.account }),
			registry,
			"InputStringEmpty",
		);
	});
});

describe("KritherRegistry — lifecycle steps", async function () {
	it("lets a lot holder add a step and emits event", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.emit(
			registry.write.addLifecycleChange([1n, 500n, CID], {
				account: producer.account,
			}),
			registry,
			"LifecycleChanged",
		);
	});

	it("refuses a non-holder trying to add a step", async function () {
		const { registry, other } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, 500n, CID], {
				account: other.account,
			}),
			registry,
			"InputIdlotOwnershipInvalid",
		);
	});

	it("increments the lot's lifecycleChanges counter", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployWithLot);

		const [, before] = await registry.read.lots([1n]);
		await registry.write.addLifecycleChange([1n, 500n, NEW_CID], {
			account: producer.account,
		});
		const [, after] = await registry.read.lots([1n]);

		assert.equal(after, before + 1n);
	});

	it("updates the lot URI to the new CID", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployWithLot);

		assert.equal(await registry.read.uri([1n]), CID);

		await registry.write.addLifecycleChange([1n, 500n, NEW_CID], {
			account: producer.account,
		});

		assert.equal(await registry.read.uri([1n]), NEW_CID);
	});

	it("refuses a holder passing a quantity other than their balance", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, 599n, NEW_CID], {
				account: producer.account,
			}),
			registry,
			"InputIdlotOwnershipInvalid",
		);
	});

	it("rejects a lifecycle change with zero quantity", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, 0n, NEW_CID], {
				account: producer.account,
			}),
			registry,
			"InputNumberNull",
		);
	});

	it("rejects a lifecycle change with an empty CID", async function () {
		const { registry, producer } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, 500n, ""], {
				account: producer.account,
			}),
			registry,
			"InputStringEmpty",
		);
	});
});
