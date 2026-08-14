## 1. Deployment topology

Two Krither contracts plus the reference account factory. No proxy, no
per-product contract.

```
KritherRegistry              KritherPaymaster
- ERC-1155 provenance        - ERC-4337 paymaster
- the role authority   <---- - reads ALL roles from the registry
- pausable                   - sells subscription plans
                             - pausable (independently)
                                      |
                                      v
                             EntryPoint v0.8 (canonical, external)
                                      ^
                                      |
                             SimpleAccount-style smart accounts (users)
                                      ^
                                      |
                             KritherAccountFactory
                             - SimpleAccountFactory, unmodified
                             - counterfactual addresses, deployed by initCode
```

`ignition/modules/Krither.ts` covers steps 1 to 3 and nothing more:

1. `KritherRegistry(admin)` - `admin` gets `DEFAULT_ADMIN_ROLE`. The module
   passes a fixed address, not the deployer.
2. `KritherAccountFactory(entryPoint)` - the reference `SimpleAccountFactory`.
   Its constructor calls `entryPoint.senderCreator()`, so it can only be
   deployed on a chain that has the EntryPoint.
3. `KritherPaymaster(registry, entryPoint)` - immutable wiring, and it
   whitelists the registry + itself as sponsored targets in the constructor.

```bash
pnpm hardhat ignition deploy ignition/modules/Krither.ts --network sepolia
```

Everything below is a separate admin operation, deliberately left out of the
module because none of its values are settled:

4. Registry admin grants `PAYMASTER_ROLE` to whoever operates the sponsorship.
5. That operator calls `setMaxCostPerOp(...)` (it is **0** at deploy, so the
   paymaster sponsors nothing until this is set), `addStake(delay)` with value,
   and funds the EntryPoint deposit.
6. Registry admin calls `addPlan(PRODUCER_ROLE, price, quota, period)` to open
   the producer plan as plan id `0`.

**Key architectural fact:** the paymaster holds no roles of its own. Every
`onlyRegistryRole(X)` check is a live `IAccessControl(registry).hasRole(X, ...)`
call. Revoking a role in the registry instantly stops sponsorship - nothing to
sync.

---

## 2. File map

| File                                 | Role                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `base/KritherRegistry.sol`           | The deployable registry: lots, items, lifecycle, locators.                          |
| `base/KritherPaymaster.sol`          | The deployable paymaster: 4337 hooks, free ops, gas budget, withdrawals.            |
| `base/KritherAccountFactory.sol`     | `SimpleAccountFactory` v0.8, unmodified. Empty subclass so Hardhat emits its artifact. |
| `abstracts/KritherRoles.sol`         | Roles, producer identity + reassignment, pause.                                     |
| `abstracts/KritherIds.sol`           | Pure helpers exposing the packed-id scheme on the ABI.                              |
| `abstracts/KritherSubscriptions.sol` | Plans, subscriptions, `subscribe`, pause - inherited by the paymaster.              |
| `abstracts/Errors.sol`               | Shared input-guard modifiers.                                                       |
| `libraries/Constants.sol`            | Every constant in the system. Nothing is redefined elsewhere.                       |
| `libraries/LotId.sol`                | `pack` / `lot` / `index` bit-packing.                                               |
| `interfaces/I*.sol`                  | Structs, events and external signatures. Read these first when generating types.    |
| `mocks/MockEntryPoint.sol`           | Test-only stand-in that calls the two hooks directly.                               |
| `mocks/EntryPointHarness.sol`        | `TestEntryPoint` (real v0.8 EntryPoint) + `TestAccount` (SimpleAccount). Test-only. |

---

## 3. Data model

### 3.1 Token ids

A **lot** is a batch. Each **item** in the lot is its own ERC-1155 token id,
and the balance of that id is the number of physical units.

```
idItem = (idLot << 128) | index
idLot  = idItem >> 128
index  = uint128(idItem)
```

Lot ids start at `1` (`++_nextIdLot`), item indexes start at `0`. Exposed
on-chain as pure functions so the frontend never has to reimplement it:
`itemId(idLot, index)`, `lotOf(idItem)`, `indexOf(idItem)`.

### 3.2 `Lot`

```solidity
struct Lot { address producer; uint96 itemCount; string cid; }
mapping(uint256 => Lot) public lots;                 // idLot  => Lot
mapping(uint256 => uint256) public lifecycleChanges; // idItem => count
```

`cid` is the metadata **directory** CID, frozen at mint and never updatable.
`uri(idItem)` returns `<cid>/<index>.json`, reverting `LotNotFound` for an
unknown lot and `ItemNotFound` when `index >= itemCount`.

`lot.producer` is the wallet that minted, kept immutable on purpose. To resolve
the **current** wallet after a reassignment, go through the indirection:

```
id      = producerByAddr[lot.producer]
current = producerById[id]
```

### 3.3 `Plan` and `Subscription`

```solidity
struct Plan { bytes32 role; uint96 price; uint32 quota; uint32 period; bool enabled; }

struct Subscription {
  uint8  planId;
  uint32 quota;      // sponsored ops allowed per window
  uint32 used;       // consumed in the current window
  uint32 period;     // window length, seconds
  uint64 periodEnd;  // end of the window `used` counts against
  uint64 expiresAt;  // end of the last window paid for
}
```

A subscription is a **chain of windows**. `quota` refills each `period`;
`expiresAt` is the hard end. Renewing **appends** a window
(`expiresAt += period`) and keeps the running window's `used` - allowances
never pool.

---

## 4. Roles

All defined in `Constants.sol`, all held **in the registry**.

| Role                          | Granted by | Powers                                                                                                                                                        |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEFAULT_ADMIN_ROLE` (`0x00`) | itself     | Grants/revokes every role. Registry: `addLocator`, `reassignProducer`. Paymaster: `addPlan`, `setPlan`, all withdrawals (revenue, deposit, stake).            |
| `PRODUCER_ROLE`               | admin      | `mintLot`. Buying a producer plan. Gets a stable producer id on first grant.                                                                                  |
| `RESELLER_ROLE`               | admin      | Declared, no contract logic yet. Reserved for a reseller plan.                                                                                                |
| `CONSUMER_ROLE`               | admin      | Declared, no contract logic yet. Consumer side is read-only in pilot 1.                                                                                       |
| `PAUSER_ROLE`                 | admin      | `pause`/`unpause` on **both** contracts (each has its own flag).                                                                                              |
| `PAYMASTER_ROLE`              | admin      | Day-to-day sponsorship ops: `setMaxCostPerOp`, `setSponsoredTarget`, `resetFreeOps`, `depositToEntryPoint`, `addStake`, `unlockStake`. Cannot move money out. |
| `USERS_ADMIN_ROLE`            | -          | Defined in `Constants.sol` but **not referenced by any contract**. Dead constant today.                                                                       |

Deliberate split: `PAYMASTER_ROLE` runs the sponsorship, `DEFAULT_ADMIN_ROLE`
is the only role that can take funds out.

There is **no bespoke accreditation function** - accreditation is plain
`grantRole(PRODUCER_ROLE, account)` / `revokeRole(...)` from OpenZeppelin
`AccessControlEnumerable`. The enumerable extension means the frontend can list
holders with `getRoleMemberCount(role)` + `getRoleMember(role, i)`.

**Accounts, not signers.** Roles are keyed on the ERC-4337 smart-account
address. The producer's EOA signing key is never the accredited address.

---

## 5. `KritherRegistry` - ABI surface

### Writes

| Function                                                           | Access                 | Guards                                                                          | Emits                                                              |
| ------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `mintLot(uint256[] quantities, string cid, uint256 ref) -> uint256 idLot` | `PRODUCER_ROLE`  | not paused; `quantities.length > 0`; every `quantities[i] > 0`; `cid` non-empty; `ref` unused by the caller | `LotCreated(idLot, producer, ref, cid, quantities, createdAt)`     |
| `addLifecycleChange(uint256 idItem, string cid)`                   | any holder of `idItem` | not paused; `cid` non-empty; `balanceOf(sender, idItem) != 0`                   | `LifecycleChanged(idItem, idLot, quantity, owner, cid, changedAt)` |
| `addLocator(uint256 idLot, string service, string pointer)`        | `DEFAULT_ADMIN_ROLE`   | not paused; lot exists; both strings non-empty                                  | `LocatorAdded(idLot, keccak(service), service, pointer, addedAt)`  |
| `reassignProducer(address old, address new)`                       | `DEFAULT_ADMIN_ROLE`   | not paused; `new != 0`; `old != new`; `old` is producer; `new` is not           | `ProducerReassigned(old, new, changedAt)`                          |
| `pause()` / `unpause()`                                            | `PAUSER_ROLE`          | -                                                                               | `Paused` / `Unpaused`                                              |
| `grantRole` / `revokeRole`                                         | role admin             | standard OZ, **not** blocked while paused                                       | `RoleGranted` / `RoleRevoked`                                      |
| `renounceRole(bytes32 role, address callerConfirmation)`           | the account itself     | not paused; `callerConfirmation == msg.sender`                                  | `RoleRevoked`                                                      |
| `safeTransferFrom` / `safeBatchTransferFrom` / `setApprovalForAll` | ERC-1155 standard      | **blocked while paused**                                                        | `TransferSingle` / `TransferBatch` / `ApprovalForAll`              |

`mintLot` mints the whole batch to `msg.sender` in one `_mintBatch`. The
producer holds every unit until they transfer.

`ref` is the producer's **own** identifier for the lot, their internal batch
number rather than a Krither one. The lot id stays the sequential counter; the
ref is recorded in `lotIds[producer][ref]`, which resolves it back to that id,
and is emitted indexed on `LotCreated`. It must be unused by that caller, so a
producer cannot overwrite the pointer to an earlier lot: reusing one reverts
`LotAlreadyExists`. Two producers may hold the same ref without clashing.

The mapping keys on the producer's **address**, not the producer id, so it does
not follow a wallet rotation: after `reassignProducer`, refs written by the old
address stay under it and the new address starts empty.

`addLocator` writes **no storage** - it is an event-only anchor for an
alternative storage backend (Arweave, etc.). To read locators the frontend must
scan `LocatorAdded` logs.

### Reads

| Function                                                            | Returns                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `lots(idLot)`                                                       | `(producer, itemCount, cid)` - `producer == 0` means no such lot |
| `lifecycleChanges(idItem)`                                          | number of steps recorded                                         |
| `itemsOf(idLot)`                                                    | `uint256[]` of every packed item id (reverts `LotNotFound`)      |
| `uri(idItem)`                                                       | `<cid>/<index>.json`                                             |
| `itemId` / `lotOf` / `indexOf`                                      | pure id packing helpers                                          |
| `balanceOf` / `balanceOfBatch`                                      | ERC-1155                                                         |
| `totalSupply(id)` / `exists(id)`                                    | ERC-1155 Supply                                                  |
| `producerByAddr(addr)` / `producerById(id)`                         | producer identity indirection                                    |
| `hasRole` / `getRoleMemberCount` / `getRoleMember`                  | AccessControlEnumerable                                          |
| `paused()`                                                          | circuit-breaker state                                            |
| `PRODUCER_ROLE` / `RESELLER_ROLE` / `CONSUMER_ROLE` / `PAUSER_ROLE` | role hashes                                                      |

---

## 6. `KritherPaymaster` - ABI surface

Inherits everything in `KritherSubscriptions`.

### Plans and subscriptions

| Function                                                                           | Access                                                                             | Guards                                                            | Emits                                                |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| `addPlan(bytes32 role, uint96 price, uint32 quota, uint32 period) -> uint8 planId` | registry `DEFAULT_ADMIN_ROLE`                                                      | not paused; `quota > 0`; `period > 0`; fewer than 255 plans       | `PlanSet(planId, role, price, quota, period, true)`  |
| `setPlan(uint8 planId, uint96 price, uint32 quota, uint32 period, bool enabled)`   | registry `DEFAULT_ADMIN_ROLE`                                                      | not paused; plan exists; `quota > 0`; `period > 0`                | `PlanSet(...)` - the plan's `role` cannot be changed |
| `subscribe(uint8 planId) payable`                                                  | holder of that plan's `role` in the registry                                       | not paused; plan exists and enabled; `msg.value == price` exactly | `Subscribed(account, planId, expiresAt, quota)`      |
| `planTerms(planId)`                                                                | view                                                                               |                                                                   |                                                      |
| `planCount()`                                                                      | view                                                                               |                                                                   |                                                      |
| `subscriptions(account)`                                                           | view - the full 6-field struct                                                     |                                                                   |                                                      |
| `remainingQuota(account)`                                                          | view - `0` if expired, full `quota` if the window rolled over, else `quota - used` |                                                                   |                                                      |

`subscribe` semantics in detail:

- first purchase: `periodEnd = now + period`, `expiresAt = now + period`,
  `used = 0`
- renewal while still active: `expiresAt += period`, `periodEnd` and `used` are
  **kept** (you do not get a fresh quota by renewing early)
- renewal after lapse: everything resets to `now + period`
- `msg.value` must equal the price **exactly** - `PriceMismatch` otherwise, and
  there is no refund path

### ERC-4337 hooks

| Function                                          | Access                                        |
| ------------------------------------------------- | --------------------------------------------- |
| `validatePaymasterUserOp(userOp, hash, maxCost)`  | `view`, EntryPoint only, blocked while paused |
| `postOp(mode, context, actualGasCost, feePerGas)` | EntryPoint only, **never** blocked by pause   |

`validatePaymasterUserOp` is deliberately `view` - bundlers drop
non-whitelisted paymasters that write during validation. All accounting happens
in `postOp`.

### Sponsorship terms and treasury

| Function                                                      | Access                        |
| ------------------------------------------------------------- | ----------------------------- |
| `setMaxCostPerOp(uint256)`                                    | `PAYMASTER_ROLE`              |
| `setSponsoredTarget(address, bool)`                           | `PAYMASTER_ROLE`              |
| `resetFreeOps(address)`                                       | `PAYMASTER_ROLE`              |
| `depositToEntryPoint(uint256)`                                | `PAYMASTER_ROLE`              |
| `addStake(uint32) payable`                                    | `PAYMASTER_ROLE`              |
| `unlockStake()`                                               | `PAYMASTER_ROLE`              |
| `withdrawFromEntryPoint(address payable, uint256)`            | registry `DEFAULT_ADMIN_ROLE` |
| `withdrawStake(address payable)`                              | registry `DEFAULT_ADMIN_ROLE` |
| `withdrawRevenue(address payable, uint256)`                   | registry `DEFAULT_ADMIN_ROLE` |
| `entryPointBalance()`                                         | view                          |
| `maxCostPerOp()` / `sponsoredTargets(addr)` / `freeOps(addr)` | view                          |

All of these except the reads are `whenNotPaused`.

---

## 7. How sponsorship actually decides

This is the part the frontend must model correctly, because a wrongly shaped
call is rejected at validation and the user op never lands.

### 7.1 The call must be one of two shapes

`_readTargets` decodes `userOp.callData` and accepts only:

- `execute(address target, uint256 value, bytes data)`
- `executeBatch((address,uint256,bytes)[] calls)`

Anything else reverts `CallShapeUnsupported`. Every `target` must be in
`sponsoredTargets` or it reverts `TargetNotAllowed`. Whitelisted from the
constructor: **the registry** and **the paymaster itself**.

### 7.2 Two lanes, and who picks

**Validation never reads the clock.** `TIMESTAMP` is a banned opcode during
ERC-4337 validation (ERC-7562 OP-011) and a rule-checking bundler drops any
paymaster that uses one, so every time condition is handed to the EntryPoint as
the `(validAfter, validUntil)` window the operation is valid in. The EntryPoint
is what enforces it.

Because a window is a single range, the paymaster cannot offer both lanes at
once. **The operation names the lane it wants**, in the first byte of
`paymasterData` (byte 52 of `paymasterAndData`, right after the address and the
two gas limits):

| `paymasterData` | Lane                   |
| --------------- | ---------------------- |
| `0x01`          | onboarding, free ops   |
| empty or other  | subscription and quota |

Naming the wrong lane costs nothing but a rejected operation: each lane carries
the window it is true in, so a request that lies about its state is simply never
included.

```
validatePaymasterUserOp
  |
  |-- maxCost > maxCostPerOp                     -> revert CostTooHigh
  |-- call shape / target not allowed            -> revert
  |
  |-- ONBOARDING LANE
  |     single `execute` to the paymaster, calldata is exactly 36 bytes
  |     starting with subscribe(uint8), AND paymasterData is 0x01,
  |     AND freeOps[sender] < 3
  |       -> plan must exist, sender must hold that plan's registry role
  |       -> context = (sender, true), validAfter = expiresAt
  |          (0 for an account that never subscribed, so it lands at once;
  |           a running subscription makes the op "not due" until it lapses)
  |
  `-- NORMAL LANE
        expiresAt != 0                      else revert SubscriptionExpired
        sender still holds the plan's role  else revert NotAccredited
        used >= quota AND periodEnd >= expiresAt
                                            else revert QuotaExhausted
        -> context = (sender, false), validUntil = expiresAt,
           and validAfter = periodEnd when the quota is spent, so the op
           waits for the refill instead of being refused
```

`postOp` then settles:

- **onboarding, subscription now active** -> `freeOps = 0`, emit
  `OnboardingSponsored`
- **onboarding, still no subscription** (the `subscribe` reverted) ->
  `freeOps += 1` capped at 3, emit `OnboardingFailed(account, cost, remaining)`
- **normal, inside the window** -> `used += 1` (clamped at `quota`), emit
  `OperationSponsored(account, cost, remaining)`
- **normal, window rolled over** -> `used = 1`, new
  `periodEnd = min(now + period, expiresAt)`, same event

### 7.3 Consequences the UI has to respect

- An accredited account with no plan gets **at most 3 free sponsored attempts**,
  and they can only ever be `subscribe` calls. There is no gasless minting
  before a subscription exists.
- Free ops are gated on accreditation, so an unaccredited address gets nothing.
- A successful purchase **refunds all three** free ops.
- **An early renewal consumes quota, a renewal after lapse consumes a free op.**
  Which one happens is the lane byte the frontend sets: asking for the free lane
  while the subscription still runs produces an op the bundler holds until
  `expiresAt` (`AA32 paymaster expired or not due`), never a quota charge.
- `executeBatch` is **never** treated as onboarding. A first-ever subscribe must
  be sent as a single `execute`, with `paymasterData = 0x01`.
- The smart account must already hold the plan price in native currency before
  it can subscribe. Gas is sponsored; the subscription fee is not. Funding the
  account is an off-4337 step (fiat on-ramp, transfer, or a top-up flow the
  frontend has to provide).
- `validUntil` is set to `expiresAt`, so a bundler will reject an op whose
  subscription expires before inclusion.
- A refusal is no longer always a revert. An expired subscription and a spent
  quota come back as a window the bundler reports as `AA32 paymaster expired or
  not due`, so the UI must pre-check `remainingQuota(account)` and
  `subscriptions(account)` to say anything useful about why.

---

## 8. Pause behaviour

Two independent circuit breakers, both driven by registry `PAUSER_ROLE`.

**Registry paused:** `mintLot`, `addLifecycleChange`, `addLocator`,
`reassignProducer`, `renounceRole`, `setApprovalForAll` and **every ERC-1155
transfer** revert. Reads are unaffected, so public provenance pages keep
working.

`grantRole` and `revokeRole` are the exception, and stay open on purpose: the
paymaster reads accreditation live from the registry, so revoking a role is how
a compromised account is cut off from sponsorship, and the breakers are
independent. `renounceRole` is closed because it is the account acting on
itself, which is not a lever incident response needs.

**Paymaster paused:** `validatePaymasterUserOp` reverts - all gasless traffic
stops. `subscribe`, `addPlan`, `setPlan`, `resetFreeOps` and every treasury
function revert too. `postOp` deliberately still works: an op already accepted
must settle.

Note the asymmetry - pausing only the paymaster leaves the registry usable by
anyone paying their own gas.

---

## 9. Events to index

| Event                                                              | Contract  | Use in the frontend                                                               |
| ------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------- |
| `LotCreated(idLot, producer, ref, cid, quantities, createdAt)`     | Registry  | The producer's lot list; the public catalogue. Indexed on `idLot`, `producer` and `ref`. |
| `LifecycleChanged(idItem, idLot, quantity, owner, cid, changedAt)` | Registry  | The provenance timeline of an item. Indexed on `idItem`, `idLot`, `owner`.        |
| `LocatorAdded(idLot, serviceKey, service, pointer, addedAt)`       | Registry  | Alternative storage pointers - **event-only, no storage to read**.                |
| `ProducerReassigned(old, new, changedAt)`                          | Registry  | Wallet-rotation history.                                                          |
| `RoleGranted` / `RoleRevoked`                                      | Registry  | Accreditation status changes.                                                     |
| `TransferSingle` / `TransferBatch`                                 | Registry  | Custody chain for an item.                                                        |
| `PlanSet(planId, role, price, quota, period, enabled)`             | Paymaster | Pricing page.                                                                     |
| `Subscribed(account, planId, expiresAt, quota)`                    | Paymaster | Billing history.                                                                  |
| `OperationSponsored(account, cost, remaining)`                     | Paymaster | Usage meter, gas-spent dashboard.                                                 |
| `OnboardingSponsored` / `OnboardingFailed`                         | Paymaster | Onboarding funnel + free-ops counter.                                             |
| `FreeOpsReset(account)`                                            | Paymaster | Support actions.                                                                  |
| `MaxCostPerOpSet` / `SponsoredTargetSet`                          | Paymaster | Admin audit trail.                                                                |
| `FundsWithdrawn(from, to, amount)`                                | Paymaster | Every movement of money out, `from` naming the pot: deposit, stake or revenue.    |
| `FundsDeposited(to, from, amountSent, amountHeld)`                | Paymaster | Gas budget and stake funded, split between what an operator sent and what came out of revenue already held. Revenue in is `Subscribed`. |

Bound every `getLogs` with a `NEXT_PUBLIC_*_DEPLOYED_BLOCK` env var. Never scan
from block 0.

---

## 10. Producer journey, end to end

### Beat 1 - Landing (no wallet)

`/` is public. Nothing on-chain.

### Beat 2 - Account creation

The producer ends up controlling an **ERC-4337 smart account**, not an EOA. The
account address is what gets accredited and what holds the tokens.

The account is built by `KritherAccountFactory`, the reference
`SimpleAccountFactory` v0.8. Its `createAccount` is callable only by the
EntryPoint's `SenderCreator`, so accounts are **counterfactual**: the address is
read off-chain with `getAddress(owner, salt)` and the account itself is deployed
by the `initCode` of its first user operation. An address can therefore be
accredited and funded before any code exists at it.

_Still open: no bundler endpoint is chosen. Tests construct `SimpleAccount`
directly rather than through the factory._

### Beat 3 - Accreditation request

Off-chain: the producer submits identity/certification evidence. On-chain, an
admin calls `registry.grantRole(PRODUCER_ROLE, smartAccount)`. That grant also
mints the producer's stable id.

UI states to render: not accredited / pending review / accredited (read
`hasRole(PRODUCER_ROLE, account)` and watch `RoleGranted`).

### Beat 4 - Subscribing

Precondition: the smart account holds at least `plan.price` in native currency.

```ts
// exact shape the onboarding lane recognises
account.execute(
	paymasterAddress,
	planPrice, // value carried into subscribe
	encodeFunctionData({ abi, functionName: "subscribe", args: [planId] }),
);
```

Sent as a user op with `paymasterAndData` pointing at the paymaster **and
`paymasterData` set to `0x01`**, the byte that asks for the free lane. Without
it the op is read as an ordinary quota-charged call and, on an account holding
no subscription, refused with `SubscriptionExpired`. Gas is sponsored out of the
free-ops budget. On success: `Subscribed` +
`OnboardingSponsored`, free ops reset to 3.

Failure to render honestly: `OnboardingFailed` tells the user how many free
attempts remain. After 3 wasted attempts the account must either pay its own gas
or ask an operator for `resetFreeOps`.

### Beat 5 - Minting a lot

The producer describes the batch: N distinct items, a quantity for each, and
metadata. The frontend pins a **directory** to IPFS containing `0.json`,
`1.json`, ... one per item, and passes the directory CID.

```ts
account.execute(
	registryAddress,
	0n,
	encodeFunctionData({
		abi,
		functionName: "mintLot",
		args: [quantities, cid, ref],
	}),
);
```

Consumes one quota unit. `LotCreated` carries the new `idLot`; item ids are
`itemId(idLot, i)` for `i` in `0..quantities.length-1`. `ref` is the producer's
own batch number, which they can look back up with `lotIds(producer, ref)` or by
filtering `LotCreated` on it.

**The CID is frozen forever.** The UI must make the review step before minting
feel final, because there is no update path - a correction can only be recorded
as a new lifecycle step.

### Beat 6 - Lifecycle steps

Any address holding units of `idItem` may append a step. For the producer that
is everything they minted and have not transferred.

```ts
account.execute(
	registryAddress,
	0n,
	encodeFunctionData({
		abi,
		functionName: "addLifecycleChange",
		args: [idItem, stepCid],
	}),
);
```

One quota unit each. The timeline is reconstructed entirely from
`LifecycleChanged` logs; `lifecycleChanges[idItem]` is just the count.

### Beat 7 - Transfer / sale

Standard ERC-1155 `safeTransferFrom` through the account. The receiver becomes a
holder and can then append their own lifecycle steps - which is how the chain of
custody keeps growing after the producer is out of the picture.

### Beat 8 - Quota and renewal

Dashboard reads: `remainingQuota(account)`, `subscriptions(account)` for
`periodEnd` (quota refill) and `expiresAt` (hard end).

Renewal is `subscribe(planId)` again with value. Note it is **not** onboarding,
so it costs a quota unit - the UI should stop a producer from burning their last
quota unit on something else near renewal time, or accept that renewal may need
self-paid gas.

### Beat 9 - Lost key

Admin calls `reassignProducer(old, new)`. The producer id and the role move; the
old address is stripped of `PRODUCER_ROLE`. **Tokens do not move** - the
ERC-1155 balances stay on the old account, and `lots[].producer` still records
the old address. The frontend must resolve display names through
`producerById[producerByAddr[lot.producer]]`.

---

## 11. Consumer / public journey

Read-only in pilot 1, no wallet required, and none of it is gated by the
`ConnectionGuard`.

1. Scan a QR carrying `idItem` (or `idLot` + `index`).
2. `lotOf(idItem)` -> `lots(idLot)` -> producer + itemCount + cid.
3. `uri(idItem)` -> `<cid>/<index>.json`, fetched from IPFS.
4. `LifecycleChanged` logs filtered on `idItem` -> the provenance timeline,
   each entry resolving its own `cid`.
5. `TransferSingle` logs -> custody chain.
6. `LocatorAdded` logs on the lot -> mirror/alternative storage.

Pilot 2 turns this side writable (consumers signing their own steps), which is
why `CONSUMER_ROLE` already exists.

---

## 12. Errors

Every custom error, from `interfaces/IErrors.sol`. Map these to user-facing
copy - a bare revert is useless in a dapp.

| Error                  | Thrown when                                          |
| ---------------------- | ---------------------------------------------------- |
| `InputNumberNull`      | zero quantity, empty batch, zero quota/period        |
| `InputStringEmpty`     | empty CID / service / pointer                        |
| `InputAddressZero`     | zero address passed to a constructor or setter       |
| `InputSimilar`         | `reassignProducer` with `old == new`                 |
| `NotHolder`            | lifecycle step on an item the caller holds none of   |
| `NotProducer`          | reassigning from an address that is not a producer   |
| `LotNotFound`          | unknown lot id                                       |
| `ItemNotFound`         | index beyond the lot's `itemCount`                   |
| `AlreadyProducer`      | reassigning onto an existing producer                |
| `NotEntryPoint`        | a 4337 hook called by anyone else                    |
| `NotAccredited`        | caller lacks the required registry role              |
| `PlanUnknown`          | plan id out of range                                 |
| `PlanDisabled`         | subscribing to a disabled plan                       |
| `PlanLimitReached`     | 255 plans already created                            |
| `PriceMismatch`        | `msg.value != plan.price`                            |
| `QuotaExhausted`       | quota spent with no window left to refill it         |
| `SubscriptionExpired`  | never subscribed, and not asking for the free lane   |
| `TargetNotAllowed`     | user op calls a non-whitelisted contract             |
| `CallShapeUnsupported` | calldata is not `execute` / `executeBatch`           |
| `CostTooHigh`          | `maxCost > maxCostPerOp`                             |
| `WithdrawFailed`       | native transfer in `withdrawRevenue` failed          |

Plus OpenZeppelin's own: `AccessControlUnauthorizedAccount`, `EnforcedPause`,
`ExpectedPause`, and the ERC-1155 family.

---

## 13. Constants worth mirroring in the frontend

| Constant                 | Value                                     |
| ------------------------ | ----------------------------------------- |
| `LOT_ID_SHIFT`           | `128`                                     |
| `MAX_FREE_OPS`           | `3`                                       |
| `SUBSCRIBE_CALL_LENGTH`  | `36` bytes                                |
| `VALID_UNTIL_SHIFT`      | `160`                                     |
| `VALID_AFTER_SHIFT`      | `208`                                     |
| `PAYMASTER_DATA_OFFSET`  | `52`                                      |
| `ONBOARDING_LANE`        | `0x01`                                    |
| `EXECUTE_SELECTOR`       | `execute(address,uint256,bytes)`          |
| `EXECUTE_BATCH_SELECTOR` | `executeBatch((address,uint256,bytes)[])` |

Everything lives in `libraries/Constants.sol` - there are no duplicated
constants anywhere else in the codebase, and none should be added.

---

## 14. Current gaps and open decisions

Things a frontend implementer will hit and that are **not** resolved on-chain:

- **No bundler chosen.** The factory is settled (`KritherAccountFactory`,
  counterfactual accounts), but Sepolia still needs a bundler URL. Tests
  construct `SimpleAccount` directly rather than through the factory.
- **Frontend contract wiring does not exist yet.** `next-env/src/constants/` has
  no ABI files; `.env.example` only has `NEXT_PUBLIC_REGISTRY_ADDRESS` /
  `_DEPLOYED_BLOCK`. A paymaster address + deploy block env var is still needed.
- **The deployment module deploys only.** `ignition/modules/Krither.ts` stops
  after the three contracts. `PAYMASTER_ROLE`, `maxCostPerOp`, the stake, the
  EntryPoint deposit and the plans stay manual admin operations, so a fresh
  deployment sponsors nothing and sells nothing until they are run.
- **`RESELLER_ROLE` / `CONSUMER_ROLE` have no contract logic** beyond being
  grantable and sellable as a plan's `role`.
- **`subscribe` requires exact payment with no refund**, so the UI must read
  `planTerms` immediately before sending - a concurrent `setPlan` price change
  will make an in-flight purchase revert.
- **Funding the smart account** with the plan price is outside the sponsored
  path and has no on-chain support.

---

## 15. Test suite

`hardhat-env/test/` - viem-based, ~4100 lines. Read `test/helpers/fixtures.ts`
first: its fixture names are the clearest inventory of the intended states
(`deployAccredited`, `deployWithBatchLot`, `deploySubscribed`,
`deployUnsubscribedAccount`, `deploySponsoredAccount`, ...).
`test/helpers/userOp.ts` shows exactly how to build and sign a v0.8
`PackedUserOperation` against this paymaster - **it is the reference the
frontend's user-op builder should match**.

Two EntryPoints are used: `MockEntryPoint` calls the hooks directly so tests can
assert on custom errors, and `TestEntryPoint` is the canonical v0.8 EntryPoint
for end-to-end runs.

```bash
cd hardhat-env && pnpm hardhat compile
cd hardhat-env && pnpm hardhat test
```
