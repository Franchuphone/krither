# next-env

Krither's web frontend. Next.js 16 (App Router, Turbopack, React Compiler) on
React 19, talking to the Sepolia contracts deployed from `hardhat-env`.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm lint
```

---

## 1. Stack

| Layer           | Choice                                                     |
| --------------- | ---------------------------------------------------------- |
| Framework       | Next.js 16, App Router, Turbopack, React Compiler           |
| UI              | Tailwind CSS v4 + shadcn/ui (`src/components/ui/`), lucide |
| Wallet          | Reown AppKit over wagmi + viem, Sepolia                    |
| Data fetching   | TanStack Query (wagmi's client)                             |
| Database        | PostgreSQL through Prisma 7 (`@prisma/adapter-pg`)         |
| Off-chain files | Pinata (IPFS pinning, groups + files API)                  |
| Chain history   | Etherscan API for receipts and logs                        |
| Notifications   | sonner                                                      |

---

## 2. Routes

| Route                        | Access               | What it is                                            |
| ---------------------------- | -------------------- | ----------------------------------------------------- |
| `/`                          | public               | Marketing landing, scroll-stack beats                 |
| `/dashboard`                 | connected wallet     | Overview, one card per unlocked role area             |
| `/dashboard/admin`           | `DEFAULT_ADMIN_ROLE` | Grants the administration roles                       |
| `/dashboard/users-admin`     | `USERS_ADMIN_ROLE`   | Accredits and revokes producers, resellers, consumers |
| `/dashboard/plans`           | `PLANS_ADMIN_ROLE`   | Creates and reprices subscription plans               |
| `/dashboard/producer`        | `PRODUCER_ROLE`      | Registration, lot creation, lot follow-up             |
| `/dashboard/pauser`          | `PAUSER_ROLE`        | Circuit breaker on both contracts                     |
| `/dashboard/paymaster`       | `PAYMASTER_ROLE`     | Sponsorship terms, deposit, stake, treasury           |
| `/verify/[producerId]`       | public               | A producer's public page                              |
| `/verify/[producerId]/[ref]` | public               | A lot's provenance, reached from its QR code          |
| `/api/rpc`                   | internal             | RPC proxy, keeps `RPC_SEPOLIA` off the client         |

`src/app/page.tsx` is **deliberately empty**. `ConnectionGuard` redirects a
connected wallet from `/` to `/dashboard` from an effect, so anything rendered
there would flash for one frame before the dashboard.

---

## 3. Folder conventions

`src/app/` holds route files only - layouts, pages, error boundaries,
`actions/`, `api/`. Every component lives under `src/components/`:

| Folder        | Contents                                                                              |
| ------------- | ------------------------------------------------------------------------------------- |
| `providers/`  | `AppKitProvider` (module-scope wallet setup), `ThemeProvider`                          |
| `connection/` | `ConnectionGuard`, `RoleGuard`, `RoleAreaGuard`, `SessionGate`, `NotConnectedHome`     |
| `layout/`     | `Layout` app shell, `Header`, `Footer`, `ThemeToggle`                                  |
| `dashboards/` | One folder per role area, matching the `DASHBOARD_AREAS` segments                      |
| `cards/`      | Shared cards: `ReadCallCard`, `WriteCallCard`, `StatCard`, `QrPanel`, ...              |
| `buttons/`    | `HeaderConnectButton`, `WalletButton`, `CustomButton`, `HomeButton`                    |
| `nav/`        | `DashboardNav`, `PillNav`, plus the screen-level `Detail`, `LoadingAlert`, `StatusScreen`, `Section` |
| `brand/`      | `Logo`                                                                                 |
| `ui/`         | shadcn primitives, generated                                                           |

Cross-folder imports always use the `@/` alias, never `../`.

---

## 4. Providers and guards

Nesting in `src/app/layout.tsx`, order matters:

```
ThemeProvider -> AppKitProvider -> Layout (Header/Footer) -> ConnectionGuard -> page
```

with `<Toaster />` outside the guarded tree and `<html suppressHydrationWarning>`.

- **`AppKitProvider`** builds one `WagmiAdapter` (`ssr: true`, `http()` pointed
  at `/api/rpc`) and calls `createAppKit(...)` exactly once, both at module
  scope. There is no separate wagmi config file: chain and RPC change here.
- **`ConnectionGuard`** leaves the public routes open and gates the rest,
  bouncing a disconnected visitor back to `/`. Pages below it may assume a
  connected wallet.
- **`RoleGuard`** publishes the `RolesContext` flags (`isAdmin`, `isUsersAdmin`,
  `isPlansAdmin`, `isProducer`, `isPauser`, `isPaymaster`) read from the
  registry; **`RoleAreaGuard`** gates one dashboard segment on its flag.
- **Hydration rule**: wallet state and theme are client-only. Anything reading
  them uses the mounted-flag pattern and renders `null` pre-mount.

`src/lib/dashboard.ts` is the single source of truth for the nav, the overview
cards and the per-route guards - a new area is one entry in `DASHBOARD_AREAS`.

---

## 5. Contract wiring

`src/lib/registry.ts` and `src/lib/paymaster.ts` hold the ABI plus the address
read from an env var. **Both are generated** - do not hand-edit them:

```bash
cd ../hardhat-env && pnpm sync:abi
```

reads the Ignition deployment and rewrites them, address and deploy block
included. `src/lib/roles.ts` mirrors the role hashes, `src/lib/entryPoint.ts`
the EntryPoint v0.8 surface, `src/lib/contractFields.ts` the field descriptors
the generic `ReadCallCard` / `WriteCallCard` render from.

Log scans are bounded by `NEXT_PUBLIC_REGISTRY_DEPLOYED_BLOCK`, never run from
block 0.

---

## 6. Server side

- **Session** (`src/lib/session.ts`, `src/app/actions/session.ts`): SIWE. A
  nonce cookie is issued, the wallet signs the message, `verifySiweMessage`
  checks it, and the address is sealed into an HMAC-signed `krither_session`
  cookie (1 h, httpOnly, sameSite strict). Server actions then gate on the role
  the call needs.
- **Server actions** live in `src/app/actions/`: producer registration and lots,
  users-admin producer management.
- **Database** (`prisma/schema.prisma`): `Producer`, `Lot`, `LotItem`,
  `LotDocument`, `Contact`. The off-chain half - accreditation files, draft
  lots, documents - while the chain holds the proof. The client is generated
  into `src/generated/prisma` (git-ignored, rebuilt by `postinstall`).
- **IPFS** (`src/lib/pinata.ts`): a lot's metadata directory is pinned as a
  Pinata group, one `<index>.json` per item, and that CID is what gets minted.
  `PINATA_JWT` / `PINATA_GATEWAY` are server-only; visitor-facing links go
  through `NEXT_PUBLIC_IPFS_GATEWAY`, because the private gateway cannot be read
  from a browser.
- **Verification** (`src/lib/verification.ts`): rebuilds a lot's public page
  from Etherscan logs and receipts, cross-checked against the database.

---

## 7. Environment

`.env.local`, git-ignored.

| Variable                                   | Side   | Use                                          |
| ------------------------------------------ | ------ | -------------------------------------------- |
| `NEXT_PUBLIC_PROJECT_ID`                   | client | Reown AppKit project id                      |
| `NEXT_PUBLIC_APP_URL`                      | client | Wallet metadata origin                       |
| `NEXT_PUBLIC_REGISTRY_PRODUCTION_ADDRESS`  | client | Registry address, written by `sync:abi`      |
| `NEXT_PUBLIC_PAYMASTER_PRODUCTION_ADDRESS` | client | Paymaster address, written by `sync:abi`     |
| `NEXT_PUBLIC_REGISTRY_DEPLOYED_BLOCK`      | client | Lower bound of every log scan                |
| `NEXT_PUBLIC_BLOCK_EXPLORER_URL`           | client | Explorer links                               |
| `NEXT_PUBLIC_ETHERSCAN_API_URL`            | client | Etherscan API base                           |
| `NEXT_PUBLIC_IPFS_GATEWAY`                 | client | Public gateway for visitor-facing CID links  |
| `RPC_SEPOLIA`                              | server | Sepolia RPC, reached only through `/api/rpc` |
| `ETHERSCAN_API_KEY`                        | server | Etherscan API key                            |
| `PINATA_JWT` / `PINATA_GATEWAY`            | server | Pinning and private gateway reads            |
| `DATABASE_URL`                             | server | PostgreSQL connection string                 |
| `SESSION_SECRET`                           | server | HMAC key for the session cookie              |

---

## 8. Database commands

```bash
pnpm db:generate   # regenerate the Prisma client
pnpm db:migrate    # create + apply a migration (dev)
pnpm db:deploy     # apply migrations (also run by vercel-build)
pnpm db:studio
```

---

## 9. Design tokens

`src/app/globals.css` defines the brand palette once as `--k-*` (blue-ink
`#2f8093`, blue `#59b5ca`, green `#79caac`, grey `#c9d1dd`, plus the neutral
ramp `--k-grey-50` to `--k-grey-900`), then maps it onto the full shadcn token
set for light and `.dark`. Primary is blue-ink in light, blue in dark;
`--proof` is the green reserved for verified provenance.

Always use the tokens (`bg-primary`, `text-muted-foreground`, `text-proof`, ...),
never a raw hex. Fonts: Inter (`--font-sans`) and JetBrains Mono
(`--font-mono`, for addresses, hashes and CIDs).

---

## 10. Build gotchas

- `sharp`, `unrs-resolver` and `@reown/appkit` are approved in
  `pnpm-workspace.yaml` (`onlyBuiltDependencies`).
- A pnpm `override` pins `@coinbase/cdp-sdk` to `1.51.2`. Newer versions pull
  optional `@x402/*` payment packages this dapp never uses and that break the
  Turbopack build.
