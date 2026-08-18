# Krither — project notes for Claude

Blockchain supply-chain tracker for small & mid-sized producers (food producers,
artisans, handmakers): on-chain, transparent, tamper-proof product provenance.

Shared cross-project conventions live in `~/Repositories/CLAUDE.md` (aarch64/WSL
notes, Slither+Hardhat 3 workaround, the dapp frontend pattern this project
follows). This file only records what is specific to Krither.

## Monorepo layout

| Folder        | Stack                                                              |
| ------------- | ----------------------------------------------------------------- |
| `hardhat-env` | Solidity + Hardhat 3 + OpenZeppelin, tests on **viem**.           |
| `next-env`    | Next.js 16 (App Router, Turbopack, React Compiler) frontend.      |

pnpm per workspace. Compile Solidity through Hardhat (aarch64 — no standalone solc).

## Frontend structure (`next-env`)

Imported from the `voting-dapp/next-env` reference. Key files:

- `src/app/AppKitProvider.tsx` — module-scope wallet setup. One `WagmiAdapter`
  (`ssr: true`, `http()` pointed at the `/api/rpc` proxy) + a single
  `createAppKit(...)`. Network is **Sepolia**. Nests `WagmiProvider` +
  `QueryClientProvider`.
- `src/app/ThemeProvider.tsx` — `next-themes`, `attribute="class"`, system default.
- `src/app/ConnectionGuard.tsx` — **adapted** from the reference. In voting-dapp
  `/` is itself the connect wall; in Krither **`/` is a PUBLIC marketing landing**
  (the scroll homepage) shown to everyone. The guard leaves `/` open and gates
  every *other* route, bouncing disconnected users back to `/`. Pages under any
  non-`/` route may assume a connected wallet.
- Provider nesting in `src/app/layout.tsx`:
  `ThemeProvider → AppKitProvider → ConnectionGuard → page`, with `<Toaster/>`
  (sonner) outside the guard. `<html suppressHydrationWarning>`.

### Built but intentionally NOT mounted yet

Per current direction, the app chrome is written and ready but **not rendered**.
When we want it shown, mount `Header` (and optionally `Footer`) around
`ConnectionGuard` in `layout.tsx`:

- `src/components/layout/Header.tsx` — fixed transparent overlay bar: KRITHER
  wordmark + `ThemeToggle` + `HeaderConnectButton`.
- `src/components/layout/Footer.tsx`, `ThemeToggle.tsx`
- `src/components/connection/HeaderConnectButton.tsx`, `WalletButton.tsx` —
  wallet connect / account / network / balance controls (open AppKit modal).

Do not mount these until asked.

### Homepage

`src/app/page.tsx` is a scroll-stack "pinned beats" landing (no.ca / arpalis
style): big KRITHER, one gigantic letter per beat with a line of info, final
name. Scroll-snap markers + `scroll-snap-type: y mandatory` keep it resting on a
beat; `prefers-reduced-motion` falls back to stacked sections. Uses only the
design tokens in `globals.css` (teal `--primary`, hue ~223) — no hardcoded hex.

## Colours / design tokens

`src/app/globals.css` holds the full shadcn-style token set (light + `.dark`).
Primary is teal/cyan (`oklch(0.52 0.105 223…)`). Always use tokens
(`bg-primary`, `text-muted-foreground`, …), never raw hex.

## Env vars (`next-env/.env.local`, git-ignored; `.env.example` committed)

- `NEXT_PUBLIC_PROJECT_ID` — Reown AppKit project id.
- `RPC_SEPOLIA` — Sepolia RPC. Server-only: the browser talks to the
  `src/app/api/rpc` route, which forwards to it, so the key stays off the client.
- `NEXT_PUBLIC_APP_URL` — wallet-metadata origin.
- `ETHERSCAN_API_KEY` — Etherscan API. Server-only, use it from a route handler.
- `NEXT_PUBLIC_REGISTRY_ADDRESS` / `NEXT_PUBLIC_REGISTRY_DEPLOYED_BLOCK` —
  contract address + deploy block (bounds event-log scans). Never hardcode
  addresses; read them from env.

## Gotchas

- **pnpm build gate**: `sharp`, `unrs-resolver`, `@reown/appkit` are approved in
  `next-env/pnpm-workspace.yaml` (`allowBuilds` / `onlyBuiltDependencies`).
- **cdp-sdk / x402**: a pnpm `override` in `next-env/pnpm-workspace.yaml` pins
  `@coinbase/cdp-sdk` to `1.51.2`. Newer (>=1.52) pulls optional `@x402/*`
  payment packages that a web dapp never uses and that break the Turbopack build.
  Don't remove the override unless AppKit/wagmi stop dragging in that chain.

## Commands

```bash
# frontend
cd next-env && pnpm dev            # http://localhost:3000
cd next-env && pnpm build         # Turbopack production build (run to verify)

# contracts
cd hardhat-env && pnpm hardhat compile
cd hardhat-env && pnpm hardhat test
```
