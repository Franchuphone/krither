import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { zeroAddress } from "viem";

const { viem, networkHelpers } = await network.create();

const CID = "bafkreialgaeseaweedharvest2026quiberon";
const NEW_CID = "bafkreiupdatedlifecyclemetadatadryingstep";

/** Deploys registry with necessaries roles accounts  */
async function deployRegistry() {
	const [admin, producer1, producer2, producer3, producer4, other, pauser] =
		await viem.getWalletClients();

	const registry = await viem.deployContract("KritherRegistry", [
		admin.account.address,
	]);

	return {
		registry,
		admin,
		producer1,
		producer2,
		producer3,
		producer4,
		other,
		pauser,
	};
}

/** Deploys registry and accredits producer1 with PRODUCER_ROLE */
async function deployAccredited() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer1.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/** Accredits producer1 and mints 1 lot */
async function deployWithLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([500n, CID], {
		account: fixture.producer1.account,
	});

	return fixture;
}

/**  Deploys registry with two distinct producers, one lot each */
async function deployTwoLots() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer1.account.address],
		{ account: fixture.admin.account },
	);
	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer2.account.address],
		{ account: fixture.admin.account },
	);

	await fixture.registry.write.mintLot([500n, CID], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.mintLot([1n, NEW_CID], {
		account: fixture.producer2.account,
	});

	return fixture;
}

/** Accredits producer1, producer2, producer3 (in that order) as producers. */
async function deployThreeProducers() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	for (const p of [
		fixture.producer1,
		fixture.producer2,
		fixture.producer3,
	]) {
		await fixture.registry.write.grantRole([PRODUCER_ROLE, p.account.address], {
			account: fixture.admin.account,
		});
	}

	return fixture;
}

/** Builds on deployWithLot and grants PAUSER_ROLE */
async function deployForPause() {
	const fixture = await deployWithLot();
	const PAUSER_ROLE = await fixture.registry.read.PAUSER_ROLE();

	await fixture.registry.write.grantRole(
		[PAUSER_ROLE, fixture.pauser.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/**
 * Surfboard resale: producer1 mints a unique lot (qty 1) then sells it,
 * transferring lot #1 to `other` (a role-less buyer / owner).
 */
async function deploySoldUniqueLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([1n, CID], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.safeTransferFrom(
		[
			fixture.producer1.account.address,
			fixture.other.account.address,
			1n,
			1n,
			"0x",
		],
		{ account: fixture.producer1.account },
	);

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

	it("reverts when deployed with the zero address as admin", async function () {
		const { registry } = await networkHelpers.loadFixture(deployRegistry);

		await viem.assertions.revertWithCustomError(
			viem.deployContract("KritherRegistry", [zeroAddress]),
			registry,
			"InputAddressZero",
		);
	});
});

describe("KritherRegistry — producer accreditation", async function () {
	it("lets the admin grant and revoke PRODUCER_ROLE", async function () {
		const { registry, admin, producer1 } =
			await networkHelpers.loadFixture(deployRegistry);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await registry.write.grantRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer1.account.address,
			]),
			true,
		);

		await registry.write.revokeRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer1.account.address,
			]),
			false,
		);
	});

	it("refuses a non-admin trying to grant PRODUCER_ROLE", async function () {
		const { registry, producer1, other } =
			await networkHelpers.loadFixture(deployAccredited);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await viem.assertions.revertWithCustomError(
			registry.write.grantRole([PRODUCER_ROLE, other.account.address], {
				account: producer1.account,
			}),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});
});

describe("KritherRegistry — producer id assignment (_grantRole)", async function () {
	it("assigns sequential producer ids in accreditation order", async function () {
		const { registry, producer1, producer2, producer3 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		assert.equal(
			await registry.read.producerIds([producer1.account.address]),
			1n,
		);
		assert.equal(
			await registry.read.producerIds([producer2.account.address]),
			2n,
		);
		assert.equal(
			await registry.read.producerIds([producer3.account.address]),
			3n,
		);
	});

	it("records the reverse id -> address map for each producer", async function () {
		const { registry, producer1, producer2, producer3 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		assert.equal(
			(await registry.read.producerById([1n])).toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			(await registry.read.producerById([2n])).toLowerCase(),
			producer2.account.address.toLowerCase(),
		);
		assert.equal(
			(await registry.read.producerById([3n])).toLowerCase(),
			producer3.account.address.toLowerCase(),
		);
	});

	it("assigns no producer id for a non-producer role", async function () {
		const { registry, admin, pauser } =
			await networkHelpers.loadFixture(deployRegistry);

		const PAUSER_ROLE = await registry.read.PAUSER_ROLE();
		await registry.write.grantRole([PAUSER_ROLE, pauser.account.address], {
			account: admin.account,
		});

		assert.equal(
			await registry.read.producerIds([pauser.account.address]),
			0n,
		);
	});

	it("does not consume a new id when re-granting an existing producer", async function () {
		const { registry, admin, producer1, producer2 } =
			await networkHelpers.loadFixture(deployRegistry);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		// producer1 -> id 1
		await registry.write.grantRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);
		// redundant grant: must NOT bump the counter
		await registry.write.grantRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);
		// producer2 must still get id 2, proving the redundant grant consumed nothing
		await registry.write.grantRole(
			[PRODUCER_ROLE, producer2.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.producerIds([producer1.account.address]),
			1n,
		);
		assert.equal(
			await registry.read.producerIds([producer2.account.address]),
			2n,
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
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.emit(
			registry.write.mintLot([500n, CID], {
				account: producer1.account,
			}),
			registry,
			"LotCreated",
		);

		assert.equal(
			await registry.read.balanceOf([producer1.account.address, 1n]),
			500n,
		);
		const [lotProducer] = await registry.read.lots([1n]);
		assert.equal(
			lotProducer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
	});

	it("rejects a mint with zero quantity", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([0n, CID], { account: producer1.account }),
			registry,
			"InputNumberNull",
		);
	});

	it("rejects a mint with an empty CID", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([500n, ""], { account: producer1.account }),
			registry,
			"InputStringEmpty",
		);
	});
});

describe("KritherRegistry — multiple lots", async function () {
	it("assigns each lot to its own producer", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoLots);

		const [lot1Producer] = await registry.read.lots([1n]);
		const [lot2Producer] = await registry.read.lots([2n]);

		assert.equal(
			lot1Producer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			lot2Producer.toLowerCase(),
			producer2.account.address.toLowerCase(),
		);
	});

	it("credits each producer with their own lot balance", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoLots);

		assert.equal(
			await registry.read.balanceOf([producer1.account.address, 1n]),
			500n,
		);
		assert.equal(
			await registry.read.balanceOf([producer2.account.address, 2n]),
			1n,
		);
	});

	it("stores each lot's own CID", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoLots);

		assert.equal(await registry.read.uri([1n]), CID);
		assert.equal(await registry.read.uri([2n]), NEW_CID);
	});

	it("tracks each lot's supply independently", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoLots);

		assert.equal(await registry.read.totalSupply([1n]), 500n);
		assert.equal(await registry.read.totalSupply([2n]), 1n);
	});
});

describe("KritherRegistry — lifecycle steps", async function () {
	it("lets a lot holder add a step and emits event", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.emit(
			registry.write.addLifecycleChange([1n, CID], {
				account: producer1.account,
			}),
			registry,
			"LifecycleChanged",
		);
	});

	it("refuses a non-holder trying to add a step", async function () {
		const { registry, other } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, CID], {
				account: other.account,
			}),
			registry,
			"NotHolder",
		);
	});

	it("increments the lot's lifecycleChanges counter", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		const [, before] = await registry.read.lots([1n]);
		await registry.write.addLifecycleChange([1n, NEW_CID], {
			account: producer1.account,
		});
		const [, after] = await registry.read.lots([1n]);

		assert.equal(after, before + 1n);
	});

	it("records two successive changes on the same lot", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		const [, before] = await registry.read.lots([1n]);

		await registry.write.addLifecycleChange([1n, CID], {
			account: producer1.account,
		});
		await registry.write.addLifecycleChange([1n, NEW_CID], {
			account: producer1.account,
		});

		const [, after] = await registry.read.lots([1n]);
		assert.equal(after, before + 2n);
	});

	it("rejects a lifecycle change with an empty CID", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, ""], {
				account: producer1.account,
			}),
			registry,
			"InputStringEmpty",
		);
	});
});

describe("KritherRegistry — pause (SecOps)", async function () {
	it("lets a PAUSER_ROLE holder pause and unpause", async function () {
		const { registry, pauser } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });
		assert.equal(await registry.read.paused(), true);

		await registry.write.unpause({ account: pauser.account });
		assert.equal(await registry.read.paused(), false);
	});

	it("refuses pausing from an account without PAUSER_ROLE", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployForPause);

		await viem.assertions.revertWithCustomError(
			registry.write.pause({ account: producer1.account }),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});

	it("freezes minting while paused", async function () {
		const { registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([500n, CID], { account: producer1.account }),
			registry,
			"EnforcedPause",
		);
	});

	it("freezes lifecycle changes while paused", async function () {
		const { registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, NEW_CID], {
				account: producer1.account,
			}),
			registry,
			"EnforcedPause",
		);
	});

	it("resumes minting after unpause", async function () {
		const { registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });
		await registry.write.unpause({ account: pauser.account });

		await viem.assertions.emit(
			registry.write.mintLot([500n, CID], { account: producer1.account }),
			registry,
			"LotCreated",
		);
	});

	it("freezes producer reassignment while paused", async function () {
		const { registry, admin, pauser, producer1, producer2 } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			registry.write.reassignProducer(
				[producer1.account.address, producer2.account.address],
				{ account: admin.account },
			),
			registry,
			"EnforcedPause",
		);
	});
});

describe("KritherRegistry — producer reassignment", async function () {
	it("lets the admin reassign a producer and emits ProducerReassigned", async function () {
		const { registry, admin, producer1, producer2 } =
			await networkHelpers.loadFixture(deployWithLot);
		const producerReassignedId = await registry.read.producerIds([
			producer1.account.address,
		]);

		await viem.assertions.emit(
			registry.write.reassignProducer(
				[producer1.account.address, producer2.account.address],
				{ account: admin.account },
			),
			registry,
			"ProducerReassigned",
		);

		assert.equal(
			producerReassignedId,
			await registry.read.producerIds([producer2.account.address]),
		);
	});

	it("refuses reassignment from a non-admin", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.reassignProducer(
				[producer1.account.address, producer2.account.address],
				{ account: producer1.account },
			),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});

	it("re-attributes every lot of a producer in one call, leaving lots immutable", async function () {
		const { registry, admin, producer1, producer2 } =
			await networkHelpers.loadFixture(deployWithLot);
		const ProducerReassigned = await registry.read.producerIds([
			producer1.account.address,
		]);

		// producer1 already holds lot #1; mint a second lot from the same producer
		await registry.write.mintLot([1n, NEW_CID], {
			account: producer1.account,
		});

		await registry.write.reassignProducer(
			[producer1.account.address, producer2.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.producerIds([producer2.account.address]),
			ProducerReassigned,
		);

		// the original producer stored on each lot is never rewritten
		const [lot1Producer] = await registry.read.lots([1n]);
		const [lot2Producer] = await registry.read.lots([2n]);
		assert.equal(
			lot1Producer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			lot2Producer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
	});

	it("transfers PRODUCER_ROLE from the old address to the new one", async function () {
		const { registry, admin, producer1, producer2 } =
			await networkHelpers.loadFixture(deployWithLot);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await registry.write.reassignProducer(
			[producer1.account.address, producer2.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer2.account.address,
			]),
			true,
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer1.account.address,
			]),
			false,
		);
	});

	it("refuses reassigning an address that is not a producer", async function () {
		const { registry, admin, producer2, other } =
			await networkHelpers.loadFixture(deployWithLot);

		// `other` was never granted PRODUCER_ROLE
		await viem.assertions.revertWithCustomError(
			registry.write.reassignProducer(
				[other.account.address, producer2.account.address],
				{ account: admin.account },
			),
			registry,
			"NotProducer",
		);
	});

	it("refuses reassigning an address to itself", async function () {
		const { registry, admin, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.reassignProducer(
				[producer1.account.address, producer1.account.address],
				{ account: admin.account },
			),
			registry,
			"InputSimilar",
		);
	});

	// The real requirement: starting ONLY from the lot, resolution must reach the
	// producer's current wallet after any number of rotations, while the lot's
	// "made by" address stays the original.
	it("resolves lot #1 to the current producer after two rotations", async function () {
		const { registry, admin, producer1, producer2, producer3 } =
			await networkHelpers.loadFixture(deployWithLot);

		await registry.write.reassignProducer(
			[producer1.account.address, producer2.account.address],
			{ account: admin.account },
		);
		await registry.write.reassignProducer(
			[producer2.account.address, producer3.account.address],
			{ account: admin.account },
		);

		// lot #1 -> original producer -> stable id -> current wallet
		const [maker] = await registry.read.lots([1n]);
		const id = await registry.read.producerIds([maker]);
		const current = await registry.read.producerById([id]);

		assert.equal(
			maker.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			current.toLowerCase(),
			producer3.account.address.toLowerCase(),
		);
	});

	it("resolves lot #1 to the current producer after three rotations", async function () {
		const { registry, admin, producer1, producer2, producer3, producer4 } =
			await networkHelpers.loadFixture(deployWithLot);

		await registry.write.reassignProducer(
			[producer1.account.address, producer2.account.address],
			{ account: admin.account },
		);
		await registry.write.reassignProducer(
			[producer2.account.address, producer3.account.address],
			{ account: admin.account },
		);
		await registry.write.reassignProducer(
			[producer3.account.address, producer4.account.address],
			{ account: admin.account },
		);

		const [maker] = await registry.read.lots([1n]);
		const id = await registry.read.producerIds([maker]);
		const current = await registry.read.producerById([id]);

		assert.equal(
			maker.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			current.toLowerCase(),
			producer4.account.address.toLowerCase(),
		);
	});
});

describe("KritherRegistry — ownership transfer (resale)", async function () {
	it("lets the new holder add a lifecycle step after a sale", async function () {
		const { registry, other } =
			await networkHelpers.loadFixture(deploySoldUniqueLot);

		await viem.assertions.emit(
			registry.write.addLifecycleChange([1n, NEW_CID], {
				account: other.account,
			}),
			registry,
			"LifecycleChanged",
		);

		const [, lifecycleChanges] = await registry.read.lots([1n]);

		assert.equal(lifecycleChanges, 1n);
	});

	it("stops the former holder from adding steps once the unit is sold", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deploySoldUniqueLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([1n, NEW_CID], {
				account: producer1.account,
			}),
			registry,
			"NotHolder",
		);
	});

	it("keeps the original producer as maker after a sale", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deploySoldUniqueLot);

		const [lotProducer] = await registry.read.lots([1n]);
		assert.equal(
			lotProducer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
	});
});
