import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deployRegistry, item, networkHelpers } from "./helpers/fixtures.js";

describe("KritherIds - id packing", async function () {
	it("packs a lot id and an item index into one token id", async function () {
		const { registry } = await networkHelpers.loadFixture(deployRegistry);

		assert.equal(await registry.read.itemId([3n, 1n]), item(3n, 1n));
		assert.equal(await registry.read.itemId([1n, 0n]), 1n << 128n);
	});

	it("recovers the lot and the index from a packed token id", async function () {
		const { registry } = await networkHelpers.loadFixture(deployRegistry);

		const packed = item(3n, 7n);

		assert.equal(await registry.read.lotOf([packed]), 3n);
		assert.equal(await registry.read.indexOf([packed]), 7n);
	});

	it("keeps items of different lots in disjoint id ranges", async function () {
		const { registry } = await networkHelpers.loadFixture(deployRegistry);

		// the highest index of lot 1 is still below the lowest id of lot 2
		const lastOfLot1 = await registry.read.itemId([1n, (1n << 128n) - 1n]);
		const firstOfLot2 = await registry.read.itemId([2n, 0n]);

		assert.equal(lastOfLot1 < firstOfLot2, true);
		assert.equal(await registry.read.lotOf([lastOfLot1]), 1n);
	});
});
