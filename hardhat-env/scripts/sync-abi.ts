import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextEnv = resolve(root, "../next-env");
const deployment = join(root, "ignition/deployments/chain-11155111");

const targets = [
	{
		contract: "KritherRegistry",
		future: "KritherModule#KritherRegistry",
		file: "registry.ts",
		name: "registry",
		addressEnv: "NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS",
		blockEnv: "NEXT_PUBLIC_REGISTRY_DEPLOYED_BLOCK",
	},
	{
		contract: "KritherPaymaster",
		future: "KritherModule#KritherPaymaster",
		file: "paymaster.ts",
		name: "paymaster",
		addressEnv: "NEXT_PUBLIC_PAYMASTER_PRODUCTION_ADDRESS",
		blockEnv: "NEXT_PUBLIC_PAYMASTER_DEPLOYED_BLOCK",
	},
];

const addresses = JSON.parse(
	readFileSync(join(deployment, "deployed_addresses.json"), "utf8"),
) as Record<string, string>;

/**
 * A future redeployed after a failed attempt leaves several receipts behind, so
 * the block is the one of the receipt matching the address Ignition kept.
 */
const journal = readFileSync(join(deployment, "journal.jsonl"), "utf8")
	.split("\n")
	.filter(Boolean)
	.map((line) => JSON.parse(line) as { receipt?: Record<string, unknown> });

function deployedBlock(address: string) {
	const receipt = journal
		.filter(
			(entry) =>
				String(entry.receipt?.contractAddress).toLowerCase() ===
				address.toLowerCase(),
		)
		.at(-1)?.receipt;

	if (!receipt) throw new Error(`Aucun reçu de déploiement pour ${address}`);

	return String(receipt.blockNumber);
}

let env = readFileSync(join(nextEnv, ".env"), "utf8");

function setEnv(key: string, value: string) {
	const line = new RegExp(`^${key}=.*$`, "m");
	if (!line.test(env)) throw new Error(`${key} absent de next-env/.env`);

	env = env.replace(line, `${key}=${value}`);
	console.log(`${key}=${value}`);
}

for (const target of targets) {
	const artifact = JSON.parse(
		readFileSync(
			join(
				root,
				"artifacts/contracts/base",
				`${target.contract}.sol`,
				`${target.contract}.json`,
			),
			"utf8",
		),
	) as { abi: unknown[]; bytecode: string };

	const out = join(nextEnv, "src/lib", target.file);

	writeFileSync(
		out,
		`export const ${target.name}Address = process.env
	.${target.addressEnv} as \`0x\${string}\`;

export const ${target.name}ABI = ${JSON.stringify(artifact.abi, null, "\t")} as const;

export const ${target.name}Bytecode =
	"${artifact.bytecode}" as const;
`,
	);

	execFileSync("npx", ["prettier", "--write", out], {
		cwd: nextEnv,
		stdio: "ignore",
	});

	console.log(`${target.contract} -> next-env/src/lib/${target.file}`);

	const address = addresses[target.future];
	if (!address) throw new Error(`${target.future} absent du déploiement`);

	setEnv(target.addressEnv, address);
	setEnv(target.blockEnv, deployedBlock(address));
}

writeFileSync(join(nextEnv, ".env"), env);
