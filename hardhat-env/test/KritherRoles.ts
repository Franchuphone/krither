import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	ARWEAVE_POINTER,
	CID,
	NEW_CID,
	deployAccredited,
	deployForPause,
	deployRegistry,
	deployThreeProducers,
	deployWithLot,
	item,
	networkHelpers,
	viem,
} from "./helpers/fixtures.js";

describe("KritherRoles - producer accreditation", async function () {
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

describe("KritherRoles - producer id assignment (_grantRole)", async function () {
	it("assigns sequential producer ids in accreditation order", async function () {
		const { registry, producer1, producer2, producer3 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		assert.equal(
			await registry.read.producerByAddr([producer1.account.address]),
			1n,
		);
		assert.equal(
			await registry.read.producerByAddr([producer2.account.address]),
			2n,
		);
		assert.equal(
			await registry.read.producerByAddr([producer3.account.address]),
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
			await registry.read.producerByAddr([pauser.account.address]),
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
			await registry.read.producerByAddr([producer1.account.address]),
			1n,
		);
		assert.equal(
			await registry.read.producerByAddr([producer2.account.address]),
			2n,
		);
	});

	it("gives a revoked producer its original id back when re-accredited", async function () {
		const { registry, admin, producer1, producer4 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();

		await registry.write.revokeRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);
		await registry.write.grantRole(
			[PRODUCER_ROLE, producer1.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.producerByAddr([producer1.account.address]),
			1n,
		);

		// the re-accreditation consumed no id: the next producer still gets 4
		await registry.write.grantRole(
			[PRODUCER_ROLE, producer4.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.producerByAddr([producer4.account.address]),
			4n,
		);
	});
});

describe("KritherRoles - pause (SecOps)", async function () {
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
			registry.write.mintLot([[500n], CID], {
				account: producer1.account,
			}),
			registry,
			"EnforcedPause",
		);
	});

	it("freezes transfers while paused", async function () {
		const { registry, pauser, producer1, other } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			registry.write.safeTransferFrom(
				[
					producer1.account.address,
					other.account.address,
					item(1n, 0n),
					1n,
					"0x",
				],
				{ account: producer1.account },
			),
			registry,
			"EnforcedPause",
		);
	});

	it("freezes lifecycle changes while paused", async function () {
		const { registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
				account: producer1.account,
			}),
			registry,
			"EnforcedPause",
		);
	});

	it("freezes locator additions while paused", async function () {
		const { registry, admin, pauser } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });

		await viem.assertions.revertWithCustomError(
			registry.write.addLocator([1n, "arweave", ARWEAVE_POINTER], {
				account: admin.account,
			}),
			registry,
			"EnforcedPause",
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

	it("resumes minting after unpause", async function () {
		const { registry, pauser, producer1 } =
			await networkHelpers.loadFixture(deployForPause);

		await registry.write.pause({ account: pauser.account });
		await registry.write.unpause({ account: pauser.account });

		await viem.assertions.emit(
			registry.write.mintLot([[500n], CID], {
				account: producer1.account,
			}),
			registry,
			"LotCreated",
		);
	});
});

describe("KritherRoles - producer reassignment", async function () {
	it("lets the admin reassign a producer and emits ProducerReassigned", async function () {
		const { registry, admin, producer1, producer2 } =
			await networkHelpers.loadFixture(deployWithLot);
		const producerReassignedId = await registry.read.producerByAddr([
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
			await registry.read.producerByAddr([producer2.account.address]),
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
		const producerReassigned = await registry.read.producerByAddr([
			producer1.account.address,
		]);

		// producer1 already holds lot #1; mint a second lot from the same producer
		await registry.write.mintLot([[1n], NEW_CID], {
			account: producer1.account,
		});

		await registry.write.reassignProducer(
			[producer1.account.address, producer2.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.producerByAddr([producer2.account.address]),
			producerReassigned,
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
		const id = await registry.read.producerByAddr([maker]);
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
		const id = await registry.read.producerByAddr([maker]);
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

	it("refuses reassigning onto an address that is already a producer", async function () {
		const { registry, admin, producer1, producer2 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		await viem.assertions.revertWithCustomError(
			registry.write.reassignProducer(
				[producer1.account.address, producer2.account.address],
				{ account: admin.account },
			),
			registry,
			"AlreadyProducer",
		);
	});

	it("lets a producer rotate back onto a recovered wallet", async function () {
		const { registry, admin, producer1, producer4 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		const PRODUCER_ROLE = await registry.read.PRODUCER_ROLE();
		const producer1Id = await registry.read.producerByAddr([
			producer1.account.address,
		]);

		// key lost: rotate producer1 -> producer4
		await registry.write.reassignProducer(
			[producer1.account.address, producer4.account.address],
			{ account: admin.account },
		);

		// wallet recovered: rotate back onto the original address
		await viem.assertions.emit(
			registry.write.reassignProducer(
				[producer4.account.address, producer1.account.address],
				{ account: admin.account },
			),
			registry,
			"ProducerReassigned",
		);

		assert.equal(
			await registry.read.producerByAddr([producer1.account.address]),
			producer1Id,
		);
		assert.equal(
			(await registry.read.producerById([producer1Id])).toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer1.account.address,
			]),
			true,
		);
		assert.equal(
			await registry.read.hasRole([
				PRODUCER_ROLE,
				producer4.account.address,
			]),
			false,
		);
	});

	it("leaves every other producer's id untouched after a reassignment", async function () {
		const { registry, admin, producer1, producer3, producer4 } =
			await networkHelpers.loadFixture(deployThreeProducers);

		const producer3Id = await registry.read.producerByAddr([
			producer3.account.address,
		]);

		await registry.write.reassignProducer(
			[producer1.account.address, producer4.account.address],
			{ account: admin.account },
		);

		assert.equal(
			await registry.read.producerByAddr([producer3.account.address]),
			producer3Id,
		);
		assert.equal(
			(await registry.read.producerById([producer3Id])).toLowerCase(),
			producer3.account.address.toLowerCase(),
		);
		assert.equal(
			await registry.read.producerByAddr([producer4.account.address]),
			1n,
		);
	});
});
