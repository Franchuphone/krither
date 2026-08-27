import { network } from "hardhat";
import { encodeFunctionData, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/// The canonical EntryPoint is over the Spurious Dragon size limit unless
/// compiled with the optimizer, which the test profile leaves off.
export const { viem, networkHelpers } = await network.create({
	override: { allowUnlimitedContractSize: true },
});

export const CID = "bafkreialgaeseaweedharvest2026quiberon";
export const NEW_CID = "bafkreiupdatedlifecyclemetadatadryingstep";

/** A producer's own reference for a lot, unique to them */
export const REF = 1n;
export const NEW_REF = 2n;

export const ARWEAVE_POINTER = "kX3jLm9QvRt2wYzB4nH7pC1sD8fG5hJ0kL6mN9oP2qR";

/** Terms the admin opens the monthly producer plan with */
export const PLAN_PRICE = parseEther("0.01");
export const MONTHLY_QUOTA = 1000;
export const MONTHLY_PERIOD = 30 * 24 * 60 * 60;

/** Mirrors `Constants.MAX_FREE_OPS` */
export const MAX_FREE_OPS = 3;

/** Sponsorship budget the paymaster runs on */
export const MAX_COST_PER_OP = parseEther("0.01");
export const PAYMASTER_DEPOSIT = parseEther("1");
export const PAYMASTER_STAKE = parseEther("0.1");
export const UNSTAKE_DELAY = 24 * 60 * 60;

/**
 * Key behind wallet client `producer1`, so the same actor can both sign user
 * operations for its smart account and send plain transactions.
 */
export const ACCOUNT_OWNER_KEY =
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as const;

/** Key behind wallet client `producer2` */
export const OTHER_OWNER_KEY =
	"0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as const;

export const accountOwner = privateKeyToAccount(ACCOUNT_OWNER_KEY);
export const otherOwner = privateKeyToAccount(OTHER_OWNER_KEY);

/** Packs a lot id and an item index into the token id the contract mints */
export const item = (idLot: bigint, index: bigint) => (idLot << 128n) | index;

/** Matches any block timestamp in an event-args assertion */
export const anyTimestamp = (timestamp: bigint) => timestamp > 0n;

/** Deploys registry with necessaries roles accounts  */
export async function deployRegistry() {
	const [
		admin,
		producer1,
		producer2,
		producer3,
		producer4,
		other,
		pauser,
		usersAdmin,
		plansAdmin,
	] = await viem.getWalletClients();

	const registry = await viem.deployContract("KritherRegistry", [
		admin.account.address,
	]);

	const USERS_ADMIN_ROLE = await registry.read.USERS_ADMIN_ROLE();
	await registry.write.grantRole(
		[USERS_ADMIN_ROLE, usersAdmin.account.address],
		{
			account: admin.account,
		},
	);

	return {
		registry,
		admin,
		producer1,
		producer2,
		producer3,
		producer4,
		other,
		pauser,
		usersAdmin,
		plansAdmin,
	};
}

/** Deploys registry and accredits producer1 with PRODUCER_ROLE */
export async function deployAccredited() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer1.account.address],
		{ account: fixture.usersAdmin.account },
	);

	return fixture;
}

/** Accredits producer1 and mints 1 lot holding a single item */
export async function deployWithLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([[500n], CID, REF], {
		account: fixture.producer1.account,
	});

	return fixture;
}

/** Accredits producer1 and mints 1 lot holding three items in one batch */
export async function deployWithBatchLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([[100n, 40n, 10n], CID, REF], {
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
		{ account: fixture.usersAdmin.account },
	);
	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer2.account.address],
		{ account: fixture.usersAdmin.account },
	);

	await fixture.registry.write.mintLot([[500n], CID, REF], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.mintLot([[1n], NEW_CID, REF], {
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
		{ account: fixture.usersAdmin.account },
	);
	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer2.account.address],
		{ account: fixture.usersAdmin.account },
	);

	await fixture.registry.write.mintLot([[100n, 40n, 10n], CID, REF], {
		account: fixture.producer1.account,
	});
	await fixture.registry.write.mintLot([[7n, 3n], NEW_CID, REF], {
		account: fixture.producer2.account,
	});

	return fixture;
}

/** Accredits producer1, producer2, producer3 (in that order) as producers. */
export async function deployThreeProducers() {
	const fixture = await deployRegistry();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	for (const p of [fixture.producer1, fixture.producer2, fixture.producer3]) {
		await fixture.registry.write.grantRole([PRODUCER_ROLE, p.account.address], {
			account: fixture.usersAdmin.account,
		});
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

/** Deploys the registry and a paymaster wired to it, with no plan on sale */
export async function deploySubscriptions() {
	const fixture = await deployRegistry();

	const entryPoint = await viem.deployContract("MockEntryPoint");
	const subscriptions = await viem.deployContract("KritherPaymaster", [
		fixture.registry.address,
		entryPoint.address,
	]);

	const PLANS_ADMIN_ROLE = await subscriptions.read.PLANS_ADMIN_ROLE();
	await fixture.registry.write.grantRole(
		[PLANS_ADMIN_ROLE, fixture.plansAdmin.account.address],
		{ account: fixture.admin.account },
	);

	return { ...fixture, entryPoint, subscriptions };
}

/** Opens the monthly producer plan as plan 0 */
export async function deployWithProducerPlan() {
	const fixture = await deploySubscriptions();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.subscriptions.write.addPlan(
		[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
		{ account: fixture.plansAdmin.account },
	);

	return fixture;
}

/** Producer plan open and producer1 accredited, so it may subscribe */
export async function deployAccreditedSubscriber() {
	const fixture = await deployWithProducerPlan();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer1.account.address],
		{ account: fixture.usersAdmin.account },
	);

	return fixture;
}

/** producer1 holds one window of the producer plan */
export async function deploySubscribed() {
	const fixture = await deployAccreditedSubscriber();

	await fixture.subscriptions.write.subscribe([0], {
		account: fixture.producer1.account,
		value: PLAN_PRICE,
	});

	return fixture;
}

/** producer1 accredited, `pauser` may freeze the paymaster */
export async function deploySubscriptionsForPause() {
	const fixture = await deployAccreditedSubscriber();
	const PAUSER_ROLE = await fixture.registry.read.PAUSER_ROLE();

	await fixture.registry.write.grantRole(
		[PAUSER_ROLE, fixture.pauser.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/**
 * Surfboard resale: producer1 mints a lot of one unique item then sells it,
 * transferring that item to `other` (a role-less buyer / owner).
 */
export async function deploySoldUniqueLot() {
	const fixture = await deployAccredited();

	await fixture.registry.write.mintLot([[1n], CID, REF], {
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

/**
 * Paymaster wired to a stand-in EntryPoint, with the monthly producer plan on
 * sale and a cost ceiling set. Senders here are plain wallets: the mock hands
 * the paymaster whatever `sender` a test asks for, so nothing is gained by
 * routing through a deployed account.
 */
export async function deployMockedPaymaster() {
	const fixture = await deployRegistry();

	const entryPoint = await viem.deployContract("MockEntryPoint");
	const paymaster = await viem.deployContract("KritherPaymaster", [
		fixture.registry.address,
		entryPoint.address,
	]);

	const PLANS_ADMIN_ROLE = await paymaster.read.PLANS_ADMIN_ROLE();
	await fixture.registry.write.grantRole(
		[PLANS_ADMIN_ROLE, fixture.plansAdmin.account.address],
		{ account: fixture.admin.account },
	);

	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();
	await paymaster.write.addPlan(
		[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
		{ account: fixture.plansAdmin.account },
	);

	// running the sponsorship is its own accreditation, held here by `admin`
	const PAYMASTER_ROLE = await paymaster.read.PAYMASTER_ROLE();
	await fixture.registry.write.grantRole(
		[PAYMASTER_ROLE, fixture.admin.account.address],
		{ account: fixture.admin.account },
	);
	await paymaster.write.setMaxCostPerOp([MAX_COST_PER_OP], {
		account: fixture.admin.account,
	});

	return { ...fixture, entryPoint, paymaster };
}

/**
 * producer1 accredited and holding a window of the producer plan. producer2 is
 * accredited but has bought nothing, the state an account onboards from, while
 * `other` holds no accreditation at all.
 */
export async function deployMockedSubscriber() {
	const fixture = await deployMockedPaymaster();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	for (const producer of [fixture.producer1, fixture.producer2]) {
		await fixture.registry.write.grantRole(
			[PRODUCER_ROLE, producer.account.address],
			{ account: fixture.usersAdmin.account },
		);
	}
	await fixture.paymaster.write.subscribe([0], {
		account: fixture.producer1.account,
		value: PLAN_PRICE,
	});

	return fixture;
}

/** producer1 holds a plan selling a single transaction, so quota runs out */
export async function deployMockedSingleOpSubscriber() {
	const fixture = await deployMockedPaymaster();
	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();

	await fixture.paymaster.write.setPlan(
		[0, PLAN_PRICE, 1, MONTHLY_PERIOD, true],
		{ account: fixture.plansAdmin.account },
	);
	await fixture.registry.write.grantRole(
		[PRODUCER_ROLE, fixture.producer1.account.address],
		{ account: fixture.usersAdmin.account },
	);
	await fixture.paymaster.write.subscribe([0], {
		account: fixture.producer1.account,
		value: PLAN_PRICE,
	});

	return fixture;
}

/** A subscriber on the mocked paymaster, with `pauser` able to freeze it */
export async function deployMockedForPause() {
	const fixture = await deployMockedSubscriber();
	const PAUSER_ROLE = await fixture.registry.read.PAUSER_ROLE();

	await fixture.registry.write.grantRole(
		[PAUSER_ROLE, fixture.pauser.account.address],
		{ account: fixture.admin.account },
	);

	return fixture;
}

/**
 * Paymaster wired to the canonical EntryPoint, funded and staked the way it
 * would be on Sepolia, with the monthly producer plan on sale.
 */
export async function deployRealPaymaster() {
	const fixture = await deployRegistry();

	const entryPoint = await viem.deployContract("TestEntryPoint");
	const paymaster = await viem.deployContract("KritherPaymaster", [
		fixture.registry.address,
		entryPoint.address,
	]);

	const PLANS_ADMIN_ROLE = await paymaster.read.PLANS_ADMIN_ROLE();
	await fixture.registry.write.grantRole(
		[PLANS_ADMIN_ROLE, fixture.plansAdmin.account.address],
		{ account: fixture.admin.account },
	);

	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();
	await paymaster.write.addPlan(
		[PRODUCER_ROLE, PLAN_PRICE, MONTHLY_QUOTA, MONTHLY_PERIOD],
		{ account: fixture.plansAdmin.account },
	);

	// running the sponsorship is its own accreditation, held here by `admin`
	const PAYMASTER_ROLE = await paymaster.read.PAYMASTER_ROLE();
	await fixture.registry.write.grantRole(
		[PAYMASTER_ROLE, fixture.admin.account.address],
		{ account: fixture.admin.account },
	);
	await paymaster.write.setMaxCostPerOp([MAX_COST_PER_OP], {
		account: fixture.admin.account,
	});
	await paymaster.write.addStake([UNSTAKE_DELAY], {
		account: fixture.admin.account,
		value: PAYMASTER_STAKE,
	});
	await entryPoint.write.depositTo([paymaster.address], {
		value: PAYMASTER_DEPOSIT,
	});

	return { ...fixture, entryPoint, paymaster };
}

/**
 * A smart account accredited as a producer and holding enough currency to buy
 * a plan, but no subscription yet. `producer1` signs for it.
 */
export async function deployUnsubscribedAccount() {
	const fixture = await deployRealPaymaster();

	const account = await viem.deployContract("TestAccount", [
		fixture.entryPoint.address,
		accountOwner.address,
	]);

	const PRODUCER_ROLE = await fixture.registry.read.PRODUCER_ROLE();
	await fixture.registry.write.grantRole([PRODUCER_ROLE, account.address], {
		account: fixture.usersAdmin.account,
	});
	await fixture.producer1.sendTransaction({
		to: account.address,
		value: PLAN_PRICE,
	});

	return { ...fixture, account };
}

/** The same smart account, now holding a window of the producer plan */
export async function deploySponsoredAccount() {
	const fixture = await deployUnsubscribedAccount();

	await fixture.account.write.execute(
		[
			fixture.paymaster.address,
			PLAN_PRICE,
			encodeFunctionData({
				abi: fixture.paymaster.abi,
				functionName: "subscribe",
				args: [0],
			}),
		],
		{ account: fixture.producer1.account },
	);

	return fixture;
}
