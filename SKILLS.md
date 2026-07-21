# Krither — working playbook (SKILLS)

Concrete, repeatable recipes for common tasks in this repo. Prose lives in
`CLAUDE.md`; this file is the "how do I…" cheat sheet.

## Run the frontend

```bash
cd next-env
cp .env.example .env.local      # first time — then fill in the values
pnpm dev                        # http://localhost:3000
```

Verify a change actually compiles before calling it done:

```bash
cd next-env && pnpm build
```

## Contracts (Hardhat 3 + viem)

```bash
cd hardhat-env
pnpm hardhat compile
pnpm hardhat test               # tests use viem
```

Build artifacts feed the frontend — after changing a contract, recompile, then
re-sync its ABI (see below).

## Add / update a contract in the frontend

1. Compile in `hardhat-env` so `artifacts/` is fresh.
2. Create/update `next-env/src/constants/<contract>.ts`: export the ABI and a
   typed config object. Copy the ABI from the Hardhat artifact — keep it in sync
   after every contract change.
3. Read the address from a `NEXT_PUBLIC_*` env var — never hardcode it. Add the
   var to `.env.example` and `.env.local`.
4. To enumerate factory-created contracts, read the factory's creation-event
   logs with `fromBlock` pinned by `NEXT_PUBLIC_*_DEPLOYED_BLOCK` (avoid
   full-chain `getLogs`).

## Add a wallet-gated page

1. Create `next-env/src/app/<route>/page.tsx`.
2. Nothing else needed for the gate: `ConnectionGuard` already redirects
   disconnected visitors on any non-`/` route back to `/`. The page may assume a
   connected wallet.
3. `/` stays public (the marketing landing) — don't put gated content there.

## Show the header / footer / wallet chrome (when asked)

Currently NOT mounted. To enable, edit `next-env/src/app/layout.tsx`:

```tsx
import Header from "@/components/layout/Header";
// ...
<AppKitProvider>
  <Header />
  <ConnectionGuard>{children}</ConnectionGuard>
</AppKitProvider>
```

`Header` already includes `ThemeToggle` + `HeaderConnectButton`. Add `<Footer/>`
similarly if wanted. Components live under `src/components/layout` and
`src/components/connection`.

## Read/write a contract from a component

- Reads: wagmi `useReadContract` (or `usePublicClient` for ad-hoc calls), keyed
  by TanStack Query (already provided).
- Writes: wagmi `useWriteContract` + `useWaitForTransactionReceipt`; surface
  status with sonner (`toast.loading/success/error`, `<Toaster/>` is mounted).
- Wallet/account/network UI: open the AppKit modal via `useAppKit().open(...)`
  (see `WalletButton.tsx`).

## Run Slither on the contracts (aarch64 / Hardhat 3)

`slither .` crashes on Hardhat 3 build-info. Use the merge workaround from the
shared notes (`~/Repositories/CLAUDE.md`): copy `test-1155/scripts/slither.sh`
into `hardhat-env`, compile, then `slither . --ignore-compile --filter-paths
node_modules`.

## Dependency gotchas

- If `pnpm install` reports "Ignored build scripts", the package needs approval
  in `next-env/pnpm-workspace.yaml` (`allowBuilds` + `onlyBuiltDependencies`).
- If a Turbopack build fails on `@x402/*` "module not found", the
  `@coinbase/cdp-sdk` override in `pnpm-workspace.yaml` was lost — restore the
  pin to `1.51.2`.
