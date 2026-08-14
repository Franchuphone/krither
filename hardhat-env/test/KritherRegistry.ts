import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { keccak256, toHex, zeroAddress } from "viem";

import {
	ARWEAVE_POINTER,
	CID,
	NEW_CID,
	NEW_REF,
	REF,
	anyTimestamp,
	deployAccredited,
	deployRegistry,
	deploySoldUniqueLot,
	deployTwoBatchLots,
	deployTwoLots,
	deployWithBatchLot,
	deployWithLot,
	item,
	networkHelpers,
	viem,
} from "./helpers/fixtures.js";

describe("KritherRegistry - deployment", async function () {
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

describe("KritherRegistry - lot creation", async function () {
	it("refuses minting from an account without PRODUCER_ROLE", async function () {
		const { registry, other } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([[500n], CID, REF], {
				account: other.account,
			}),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});

	it("mints the quantity to the producer and emits LotCreated", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.emitWithArgs(
			registry.write.mintLot([[500n], CID, REF], {
				account: producer1.account,
			}),
			registry,
			"LotCreated",
			[
				1n,
				(producer: string) =>
					producer.toLowerCase() ===
					producer1.account.address.toLowerCase(),
				REF,
				CID,
				[500n],
				anyTimestamp,
			],
		);

		assert.equal(
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 0n),
			]),
			500n,
		);
		const [lotProducer] = await registry.read.lots([1n]);
		assert.equal(
			lotProducer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
	});

	it("points the producer's own reference at the Krither lot id", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await registry.write.mintLot([[500n], CID, REF], {
			account: producer1.account,
		});

		assert.equal(
			await registry.read.lotIds([producer1.account.address, REF]),
			1n,
		);
	});

	it("keeps the same reference apart for two producers", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoLots);

		assert.equal(
			await registry.read.lotIds([producer1.account.address, REF]),
			1n,
		);
		assert.equal(
			await registry.read.lotIds([producer2.account.address, REF]),
			2n,
		);
	});

	it("rejects a reference the producer has already used", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([[1n], NEW_CID, REF], {
				account: producer1.account,
			}),
			registry,
			"LotAlreadyExists",
		);
	});

	it("rejects a mint with no items at all", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([[], CID, REF], {
				account: producer1.account,
			}),
			registry,
			"InputNumberNull",
		);
	});

	it("rejects a mint where any item has zero quantity", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([[100n, 0n, 10n], CID, REF], {
				account: producer1.account,
			}),
			registry,
			"InputNumberNull",
		);
	});

	it("rejects a mint with an empty CID", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.revertWithCustomError(
			registry.write.mintLot([[500n], "", REF], {
				account: producer1.account,
			}),
			registry,
			"InputStringEmpty",
		);
	});

	it("leaves the lot counter untouched when a mint reverts", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await assert.rejects(
			registry.write.mintLot([[0n], CID, NEW_REF], {
				account: producer1.account,
			}),
		);

		// the next successful mint still takes lot 2
		await registry.write.mintLot([[1n], NEW_CID, NEW_REF], {
			account: producer1.account,
		});
		const [lot2Producer] = await registry.read.lots([2n]);

		assert.equal(
			lot2Producer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
	});
});

describe("KritherRegistry - batched items under one lot", async function () {
	it("mints one token id per item in a single batch", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		assert.equal(
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 0n),
			]),
			100n,
		);
		assert.equal(
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 1n),
			]),
			40n,
		);
		assert.equal(
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 2n),
			]),
			10n,
		);
	});

	it("emits a single TransferBatch for the whole lot", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployAccredited);

		await viem.assertions.emit(
			registry.write.mintLot([[100n, 40n, 10n], CID, REF], {
				account: producer1.account,
			}),
			registry,
			"TransferBatch",
		);
	});

	it("records the item count on the lot", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		const [, itemCount] = await registry.read.lots([1n]);

		assert.equal(itemCount, 3n);
	});

	it("lists every token id of the lot via itemsOf", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		assert.deepEqual(await registry.read.itemsOf([1n]), [
			item(1n, 0n),
			item(1n, 1n),
			item(1n, 2n),
		]);
	});

	it("rejects itemsOf on a lot that does not exist", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await viem.assertions.revertWithCustomError(
			registry.read.itemsOf([999n]),
			registry,
			"LotNotFound",
		);
	});

	it("tracks each item's supply independently", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		assert.equal(await registry.read.totalSupply([item(1n, 0n)]), 100n);
		assert.equal(await registry.read.totalSupply([item(1n, 1n)]), 40n);
		assert.equal(await registry.read.totalSupply([item(1n, 2n)]), 10n);
	});

	it("transfers one item of the lot without touching the others", async function () {
		const { registry, producer1, other } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await registry.write.safeTransferFrom(
			[
				producer1.account.address,
				other.account.address,
				item(1n, 1n),
				15n,
				"0x",
			],
			{ account: producer1.account },
		);

		assert.equal(
			await registry.read.balanceOf([
				other.account.address,
				item(1n, 1n),
			]),
			15n,
		);
		assert.equal(
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 1n),
			]),
			25n,
		);
		assert.equal(
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 0n),
			]),
			100n,
		);
	});

	it("moves several items of a lot in one batch transfer", async function () {
		const { registry, producer1, other } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await registry.write.safeBatchTransferFrom(
			[
				producer1.account.address,
				other.account.address,
				[item(1n, 0n), item(1n, 2n)],
				[100n, 10n],
				"0x",
			],
			{ account: producer1.account },
		);

		assert.deepEqual(
			await registry.read.balanceOfBatch([
				[other.account.address, other.account.address],
				[item(1n, 0n), item(1n, 2n)],
			]),
			[100n, 10n],
		);
	});
});

describe("KritherRegistry - metadata directory", async function () {
	it("resolves each item to its own JSON inside the lot directory", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		assert.equal(await registry.read.uri([item(1n, 0n)]), `${CID}/0.json`);
		assert.equal(await registry.read.uri([item(1n, 1n)]), `${CID}/1.json`);
		assert.equal(await registry.read.uri([item(1n, 2n)]), `${CID}/2.json`);
	});

	it("rejects the uri of an index beyond the lot's item count", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await viem.assertions.revertWithCustomError(
			registry.read.uri([item(1n, 3n)]),
			registry,
			"ItemNotFound",
		);
	});

	it("rejects the uri of an item of a lot that does not exist", async function () {
		const { registry } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await viem.assertions.revertWithCustomError(
			registry.read.uri([item(99n, 0n)]),
			registry,
			"LotNotFound",
		);
	});
});

describe("KritherRegistry - multiple lots", async function () {
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
			await registry.read.balanceOf([
				producer1.account.address,
				item(1n, 0n),
			]),
			500n,
		);
		assert.equal(
			await registry.read.balanceOf([
				producer2.account.address,
				item(2n, 0n),
			]),
			1n,
		);
	});

	it("stores each lot's own directory CID", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoLots);

		const [, , lot1Cid] = await registry.read.lots([1n]);
		const [, , lot2Cid] = await registry.read.lots([2n]);

		assert.equal(lot1Cid, CID);
		assert.equal(lot2Cid, NEW_CID);
		assert.equal(await registry.read.uri([item(1n, 0n)]), `${CID}/0.json`);
		assert.equal(
			await registry.read.uri([item(2n, 0n)]),
			`${NEW_CID}/0.json`,
		);
	});

	it("tracks each lot's supply independently", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoLots);

		assert.equal(await registry.read.totalSupply([item(1n, 0n)]), 500n);
		assert.equal(await registry.read.totalSupply([item(2n, 0n)]), 1n);
	});
});

describe("KritherRegistry - id isolation across lots", async function () {
	it("mints no id twice across two multi-item lots", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoBatchLots);

		const lot1 = await registry.read.itemsOf([1n]);
		const lot2 = await registry.read.itemsOf([2n]);
		const all = [...lot1, ...lot2];

		assert.equal(lot1.length, 3);
		assert.equal(lot2.length, 2);
		// a Set collapses duplicates: same size means every id is unique
		assert.equal(new Set(all).size, all.length);
	});

	it("keeps the index-0 item of each lot on a distinct id", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoBatchLots);

		// both lots own an index 0; only the high 128 bits separate them
		assert.notEqual(item(1n, 0n), item(2n, 0n));
		assert.equal(await registry.read.lotOf([item(1n, 0n)]), 1n);
		assert.equal(await registry.read.lotOf([item(2n, 0n)]), 2n);
		assert.equal(await registry.read.indexOf([item(1n, 0n)]), 0n);
		assert.equal(await registry.read.indexOf([item(2n, 0n)]), 0n);
	});

	it("resolves every minted id back to the lot that minted it", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoBatchLots);

		for (const [idLot, ids] of [
			[1n, await registry.read.itemsOf([1n])],
			[2n, await registry.read.itemsOf([2n])],
		] as const) {
			for (const [index, id] of ids.entries()) {
				assert.equal(await registry.read.lotOf([id]), idLot);
				assert.equal(await registry.read.indexOf([id]), BigInt(index));
			}
		}
	});

	it("leaves the first lot's balances untouched when a second lot is minted", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoBatchLots);

		assert.deepEqual(
			await registry.read.balanceOfBatch([
				[
					producer1.account.address,
					producer1.account.address,
					producer1.account.address,
				],
				[item(1n, 0n), item(1n, 1n), item(1n, 2n)],
			]),
			[100n, 40n, 10n],
		);
		assert.deepEqual(
			await registry.read.balanceOfBatch([
				[producer2.account.address, producer2.account.address],
				[item(2n, 0n), item(2n, 1n)],
			]),
			[7n, 3n],
		);
	});

	it("gives each producer a zero balance on the other lot's items", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoBatchLots);

		assert.equal(
			await registry.read.balanceOf([producer1.account.address, item(2n, 0n)]),
			0n,
		);
		assert.equal(
			await registry.read.balanceOf([producer2.account.address, item(1n, 0n)]),
			0n,
		);
	});

	it("points each lot's items at its own metadata directory", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoBatchLots);

		// same index, different lot, different directory
		assert.equal(await registry.read.uri([item(1n, 0n)]), `${CID}/0.json`);
		assert.equal(await registry.read.uri([item(2n, 0n)]), `${NEW_CID}/0.json`);
		assert.equal(await registry.read.uri([item(1n, 1n)]), `${CID}/1.json`);
		assert.equal(await registry.read.uri([item(2n, 1n)]), `${NEW_CID}/1.json`);
	});

	it("bounds the item index per lot, not globally", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoBatchLots);

		// index 2 is valid in lot 1 (3 items) but out of range in lot 2 (2 items)
		assert.equal(await registry.read.uri([item(1n, 2n)]), `${CID}/2.json`);

		await viem.assertions.revertWithCustomError(
			registry.read.uri([item(2n, 2n)]),
			registry,
			"ItemNotFound",
		);
	});

	it("keeps each lot's item count and producer independent", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoBatchLots);

		const [lot1Producer, lot1Count, lot1Cid] = await registry.read.lots([1n]);
		const [lot2Producer, lot2Count, lot2Cid] = await registry.read.lots([2n]);

		assert.equal(lot1Count, 3n);
		assert.equal(lot2Count, 2n);
		assert.equal(lot1Cid, CID);
		assert.equal(lot2Cid, NEW_CID);
		assert.equal(
			lot1Producer.toLowerCase(),
			producer1.account.address.toLowerCase(),
		);
		assert.equal(
			lot2Producer.toLowerCase(),
			producer2.account.address.toLowerCase(),
		);
	});

	it("tracks supply per item across both lots", async function () {
		const { registry } = await networkHelpers.loadFixture(deployTwoBatchLots);

		assert.equal(await registry.read.totalSupply([item(1n, 0n)]), 100n);
		assert.equal(await registry.read.totalSupply([item(1n, 1n)]), 40n);
		assert.equal(await registry.read.totalSupply([item(1n, 2n)]), 10n);
		assert.equal(await registry.read.totalSupply([item(2n, 0n)]), 7n);
		assert.equal(await registry.read.totalSupply([item(2n, 1n)]), 3n);
	});

	it("keeps lifecycle counters separate for the same index in two lots", async function () {
		const { registry, producer1, producer2 } =
			await networkHelpers.loadFixture(deployTwoBatchLots);

		await registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
			account: producer1.account,
		});
		await registry.write.addLifecycleChange([item(2n, 0n), CID], {
			account: producer2.account,
		});
		await registry.write.addLifecycleChange([item(2n, 0n), NEW_CID], {
			account: producer2.account,
		});

		assert.equal(await registry.read.lifecycleChanges([item(1n, 0n)]), 1n);
		assert.equal(await registry.read.lifecycleChanges([item(2n, 0n)]), 2n);
		assert.equal(await registry.read.lifecycleChanges([item(1n, 1n)]), 0n);
	});

	it("stops a producer touching an item of the other producer's lot", async function () {
		const { registry, producer2 } =
			await networkHelpers.loadFixture(deployTwoBatchLots);

		// producer2 holds index 0 of lot 2, but nothing of lot 1
		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
				account: producer2.account,
			}),
			registry,
			"NotHolder",
		);
	});
});

describe("KritherRegistry - lifecycle steps", async function () {
	it("lets an item holder add a step and emits event", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.emit(
			registry.write.addLifecycleChange([item(1n, 0n), CID], {
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
			registry.write.addLifecycleChange([item(1n, 0n), CID], {
				account: other.account,
			}),
			registry,
			"NotHolder",
		);
	});

	it("increments the item's lifecycleChanges counter", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		const before = await registry.read.lifecycleChanges([item(1n, 0n)]);
		await registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
			account: producer1.account,
		});
		const after = await registry.read.lifecycleChanges([item(1n, 0n)]);

		assert.equal(after, before + 1n);
	});

	it("records two successive changes on the same item", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		const before = await registry.read.lifecycleChanges([item(1n, 0n)]);

		await registry.write.addLifecycleChange([item(1n, 0n), CID], {
			account: producer1.account,
		});
		await registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
			account: producer1.account,
		});

		const after = await registry.read.lifecycleChanges([item(1n, 0n)]);
		assert.equal(after, before + 2n);
	});

	it("keeps each item's counter independent within a lot", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await registry.write.addLifecycleChange([item(1n, 1n), NEW_CID], {
			account: producer1.account,
		});

		assert.equal(await registry.read.lifecycleChanges([item(1n, 1n)]), 1n);
		assert.equal(await registry.read.lifecycleChanges([item(1n, 0n)]), 0n);
		assert.equal(await registry.read.lifecycleChanges([item(1n, 2n)]), 0n);
	});

	it("reports the owning lot alongside the item in the event", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithBatchLot);

		await viem.assertions.emitWithArgs(
			registry.write.addLifecycleChange([item(1n, 2n), NEW_CID], {
				account: producer1.account,
			}),
			registry,
			"LifecycleChanged",
			[
				item(1n, 2n),
				1n,
				10n,
				(owner: string) =>
					owner.toLowerCase() ===
					producer1.account.address.toLowerCase(),
				NEW_CID,
				anyTimestamp,
			],
		);
	});

	it("rejects a lifecycle change with an empty CID", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([item(1n, 0n), ""], {
				account: producer1.account,
			}),
			registry,
			"InputStringEmpty",
		);
	});
});

describe("KritherRegistry - storage locators (portability)", async function () {
	it("lets the admin add a locator and emits LocatorAdded", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.emitWithArgs(
			registry.write.addLocator([1n, "arweave", ARWEAVE_POINTER], {
				account: admin.account,
			}),
			registry,
			"LocatorAdded",
			[
				1n,
				keccak256(toHex("arweave")),
				"arweave",
				ARWEAVE_POINTER,
				anyTimestamp,
			],
		);
	});

	it("refuses a locator from a producer or any non-admin", async function () {
		const { registry, producer1, other } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLocator([1n, "arweave", ARWEAVE_POINTER], {
				account: producer1.account,
			}),
			registry,
			"AccessControlUnauthorizedAccount",
		);

		await viem.assertions.revertWithCustomError(
			registry.write.addLocator([1n, "arweave", ARWEAVE_POINTER], {
				account: other.account,
			}),
			registry,
			"AccessControlUnauthorizedAccount",
		);
	});

	it("rejects a locator on a lot that does not exist", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLocator([999n, "arweave", ARWEAVE_POINTER], {
				account: admin.account,
			}),
			registry,
			"LotNotFound",
		);
	});

	it("rejects an empty service", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLocator([1n, "", ARWEAVE_POINTER], {
				account: admin.account,
			}),
			registry,
			"InputStringEmpty",
		);
	});

	it("rejects an empty pointer", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLocator([1n, "arweave", ""], {
				account: admin.account,
			}),
			registry,
			"InputStringEmpty",
		);
	});

	it("accumulates several services on the same lot", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployWithLot);

		await viem.assertions.emitWithArgs(
			registry.write.addLocator([1n, "ipfs", NEW_CID], {
				account: admin.account,
			}),
			registry,
			"LocatorAdded",
			[1n, keccak256(toHex("ipfs")), "ipfs", NEW_CID, anyTimestamp],
		);

		await viem.assertions.emitWithArgs(
			registry.write.addLocator([1n, "arweave", ARWEAVE_POINTER], {
				account: admin.account,
			}),
			registry,
			"LocatorAdded",
			[
				1n,
				keccak256(toHex("arweave")),
				"arweave",
				ARWEAVE_POINTER,
				anyTimestamp,
			],
		);
	});

	it("never alters the anchored directory CID of the lot", async function () {
		const { registry, admin } =
			await networkHelpers.loadFixture(deployWithLot);

		const anchored = await registry.read.uri([item(1n, 0n)]);

		await registry.write.addLocator([1n, "arweave", ARWEAVE_POINTER], {
			account: admin.account,
		});

		assert.equal(await registry.read.uri([item(1n, 0n)]), anchored);
		assert.equal(await registry.read.uri([item(1n, 0n)]), `${CID}/0.json`);
	});
});

describe("KritherRegistry - ownership transfer (resale)", async function () {
	it("lets the new holder add a lifecycle step after a sale", async function () {
		const { registry, other } =
			await networkHelpers.loadFixture(deploySoldUniqueLot);

		await viem.assertions.emit(
			registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
				account: other.account,
			}),
			registry,
			"LifecycleChanged",
		);

		assert.equal(await registry.read.lifecycleChanges([item(1n, 0n)]), 1n);
	});

	it("stops the former holder from adding steps once the unit is sold", async function () {
		const { registry, producer1 } =
			await networkHelpers.loadFixture(deploySoldUniqueLot);

		await viem.assertions.revertWithCustomError(
			registry.write.addLifecycleChange([item(1n, 0n), NEW_CID], {
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
