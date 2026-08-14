import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Canonical ERC-4337 EntryPoint v0.8, at the same address on every chain it is
 * deployed to.
 */
const ENTRY_POINT_V08 = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108";

/**
 * Holder of `DEFAULT_ADMIN_ROLE` on the registry, and through it the authority
 * every `onlyRegistryRole` check on the paymaster answers to. Nothing ties it
 * to the account running the deployment.
 */
const ADMIN = "0xac8Cf59877c160A3330Bec9eff20E101d050B014";

/**
 * Deploys the three Krither contracts and stops there. Sponsorship terms
 * (`setMaxCostPerOp`), the stake, the EntryPoint deposit, `PAYMASTER_ROLE` and
 * the plans are admin operations run afterwards, once their values are
 * decided: the paymaster ships with `maxCostPerOp` at 0 and sponsors nothing
 * until they are.
 */
export default buildModule("KritherModule", (m) => {
  const registry = m.contract("KritherRegistry", [ADMIN]);
  const accountFactory = m.contract("KritherAccountFactory", [ENTRY_POINT_V08]);
  const paymaster = m.contract("KritherPaymaster", [registry, ENTRY_POINT_V08]);

  return { registry, accountFactory, paymaster };
});
