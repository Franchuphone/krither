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

- `src/components/providers/AppKitProvider.tsx` — module-scope wallet setup. One
  `WagmiAdapter` (`ssr: true`, `http()` pointed at the `/api/rpc` proxy) + a single
  `createAppKit(...)`. Network is **Sepolia**. Nests `WagmiProvider` +
  `QueryClientProvider`.
- `src/components/providers/ThemeProvider.tsx` — `next-themes`, `attribute="class"`,
  system default.
- `src/components/connection/ConnectionGuard.tsx` — **adapted** from the reference. In voting-dapp
  `/` is itself the connect wall; in Krither **`/` is a PUBLIC marketing landing**
  (the scroll homepage) shown to everyone. The guard leaves `/` open and gates
  every *other* route, bouncing disconnected users back to `/`. Pages under any
  non-`/` route may assume a connected wallet.
- Provider nesting in `src/app/layout.tsx`:
  `ThemeProvider → AppKitProvider → ConnectionGuard → page`, with `<Toaster/>`
  (sonner) outside the guard. `<html suppressHydrationWarning>`.

Folder conventions: `src/app/` holds Next.js route files only (layouts, pages,
error boundaries, `actions/`, `api/`); every component lives under
`src/components/`. Dashboard components are grouped one folder per role area
(`dashboards/admin/`, `producer/`, `pauser/`, `paymaster/`), matching the
`DASHBOARD_AREAS` segments in `src/lib/dashboard.ts`. Shared components are split
by kind into `components/cards/`, `components/buttons/` and `components/nav/`
(there is no `reusable/` folder; `nav/` also holds the shared screen-level pieces
`Detail`, `LoadingAlert` and `StatusScreen`). Cross-folder imports always use the
`@/` alias, never `../`.

### App chrome

`src/components/layout/Layout.tsx` is the app shell and **is** mounted, wrapping
`ConnectionGuard` in `layout.tsx`. It renders:

- `Header.tsx` — fixed transparent overlay bar: logo + `HeaderConnectButton`. It
  imports `ThemeToggle` without rendering it yet, kept on purpose for when the
  toggle moves up here.
- `Footer.tsx` — fixed overlay carrying the `ThemeToggle`, so that is where the
  light/dark switch currently lives.
- `src/components/buttons/HeaderConnectButton.tsx`, `WalletButton.tsx` — wallet
  connect / account / network / balance controls (open AppKit modal).

### Homepage

The landing lives in `src/components/connection/NotConnectedHome.tsx`, which
`ConnectionGuard` renders at `/` for a disconnected visitor. It is a scroll-stack
"pinned beats" landing (no.ca / arpalis style): big KRITHER, one gigantic letter
per beat with a line of info, final name. Scroll-snap markers +
`scroll-snap-type: y mandatory` keep it resting on a beat;
`prefers-reduced-motion` falls back to stacked sections. Uses only the design
tokens in `globals.css` (teal `--primary`, hue ~223) — no hardcoded hex.

**`src/app/page.tsx` is deliberately empty, do not move the landing into it.**
The guard redirects a connected wallet from `/` to `/dashboard` from an effect,
so whatever `page.tsx` renders is shown for one frame first. Empty keeps that
frame invisible; putting the landing there flashes it before the dashboard.

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
