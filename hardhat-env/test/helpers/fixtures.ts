import { network } from "hardhat";
import { parseEther } from "viem";

export const { viem, networkHelpers } = await network.create();

export const CID = "bafkreialgaeseaweedharvest2026quiberon";
export const NEW_CID = "bafkreiupdatedlifecyclemetadatadryingstep";

export const ARWEAVE_POINTER = "kX3jLm9QvRt2wYzB4nH7pC1sD8fG5hJ0kL6mN9oP2qR";

/** Monthly producer plan seeded by the subscriptions constructor */
export const PRODUCER_PRICE = parseEther("0.01");
export const MONTHLY_QUOTA = 1000;
export const MONTHLY_PERIOD = 30 * 24 * 60 * 60;

/** Packs a lot id and an item index into the token id the contract mints */
export const item = (idLot: bigint, index: bigint) => (idLot << 128n) | index;

/** Matches any block timestamp in an event-args assertion */
export const anyTimestamp = (timestamp: bigint) => timestamp > 0n;

/** Deploys registry with necessaries roles accounts  */
export async function deployRegistry() {
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
export async function deployAccredited() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer1.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/** Accredits producer1 and mints 1 lot holding a single item */
export async function deployWithLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([[500n], CID], {
		account: fixture.producer1.account,
	});

	return fixture;
}

/** Accredits producer1 and mints 1 lot holding three items in one batch */
export async function deployWithBatchLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([[100n, 40n, 10n], CID], {
		account: fixture.producer1.account,
	});

	return fixture;
}

/**  Deploys registry with two distinct producers, one lot each */
export async function deployTwoLots() {
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

	await fixture.registry.write.mintLot([[500n], CID], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.mintLot([[1n], NEW_CID], {
		account: fixture.producer2.account,
	});

	return fixture;
}

/**
 * Two producers, each minting a DIFFERENT multi-item lot. Lot 1 holds three
 * items, lot 2 holds two, so both lots own an item at index 0 and 1 while only
 * lot 1 owns index 2 - the shape that would expose any id collision.
 */
export async function deployTwoBatchLots() {
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

	await fixture.registry.write.mintLot([[100n, 40n, 10n], CID], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.mintLot([[7n, 3n], NEW_CID], {
		account: fixture.producer2.account,
	});

	return fixture;
}

/** Accredits producer1, producer2, producer3 (in that order) as producers. */
export async function deployThreeProducers() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	for (const p of [fixture.producer1, fixture.producer2, fixture.producer3]) {
		await fixture.registry.write.grantRole(
			[PRODUCER_ROLE, p.account.address],
			{
				account: fixture.admin.account,
			},
		);
	}

	return fixture;
}

/** Builds on deployWithLot and grants PAUSER_ROLE */
export async function deployForPause() {
	const fixture = await deployWithLot();
	const PAUSER_ROLE = await fixture.registry.read.PAUSER_ROLE();

	await fixture.registry.write.grantRole(
		[PAUSER_ROLE, fixture.pauser.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/** Deploys the registry and a subscriptions contract wired to it */
export async function deploySubscriptions() {
	const fixture = await deployRegistry();

	const subscriptions = await viem.deployContract("KritherSubscriptions", [
		fixture.registry.address,
		PRODUCER_PRICE,
	]);

	return { ...fixture, subscriptions };
}

/**
 * Surfboard resale: producer1 mints a lot of one unique item then sells it,
 * transferring that item to `other` (a role-less buyer / owner).
 */
export async function deploySoldUniqueLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([[1n], CID], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.safeTransferFrom(
		[
			fixture.producer1.account.address,
			fixture.other.account.address,
			item(1n, 0n),
			1n,
			"0x",
		],
		{ account: fixture.producer1.account },
	);

	return fixture;
}
