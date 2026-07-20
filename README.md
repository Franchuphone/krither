<div align="center">

# 🌾 Krither

### Blockchain-based supply chain tracking for small & mid-sized producers

*Transparent. Immutable. Made for makers.*

<br />

![Status](https://img.shields.io/badge/status-early%20development-orange)
![Blockchain](https://img.shields.io/badge/blockchain-Ethereum-627EEA?logo=ethereum&logoColor=white)
![Smart Contracts](https://img.shields.io/badge/contracts-Solidity-363636?logo=solidity&logoColor=white)
![Frontend](https://img.shields.io/badge/frontend-Next.js-000000?logo=nextdotjs&logoColor=white)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

</div>

---

## 📖 Overview

**Krither** helps small and medium businesses — food producers, artisans, and
handmakers — prove the origin and journey of their products. By recording each
step of the supply chain on-chain, Krither makes that history **transparent** and
**tamper-proof**: once a record is written it cannot be altered or falsified,
giving customers and partners a trustworthy way to verify where a product comes
from and how it was made.

---

## ✨ Why Krither

| | |
| :---: | :--- |
| 🔍 | **Transparency** — every step in a product's journey is publicly verifiable. |
| 🔒 | **Immutability** — records live on the blockchain and can't be forged or edited after the fact. |
| 🤝 | **Accessible** — built for small cooperatives and independent makers, not just enterprises with big compliance budgets. |
| 🛒 | **Trust for buyers** — consumers can trace a product back to its source. |

---

## ⚙️ How it works

```
  Producer  ──▶  Processor  ──▶  Transport  ──▶  Distributor  ──▶  Retailer
     │              │               │                │               │
     └──────────────┴───────────────┴────────────────┴───────────────┘
                     each step signed & written on-chain
                                     │
                                     ▼
                    🔗 Unforgeable, public product history
```

1. A producer registers a product and its origin on-chain.
2. Each actor in the chain adds a **signed record** as the product changes hands.
3. The full, tamper-proof history is available to anyone who scans or looks up
   the product.

---

## 🧰 Tech stack

### 📜 Smart contracts (`hardhat-env`)

- **Solidity** contracts built on **[OpenZeppelin](https://www.openzeppelin.com/contracts)** for battle-tested, audited base components (access control, ownership, tokens).
- **[Hardhat](https://hardhat.org/)** for compilation, deployment, and local development.
- Tests written against **[viem](https://viem.sh/)** for type-safe contract interaction.

### 🖥️ Frontend (`next-env`)

- **[Next.js](https://nextjs.org/)** (App Router) + **React**.
- **[shadcn/ui](https://ui.shadcn.com/)** + Tailwind CSS for the component system.
- **[wagmi](https://wagmi.sh/)** + **viem** for Web3 / contract interaction.
- **[Reown AppKit](https://reown.com/)** for wallet connectivity.
- **[Etherscan API](https://docs.etherscan.io/)** for on-chain data and transaction lookups.

---

## 🗂️ Project structure

This is a monorepo with two main workspaces:

| Folder | Description |
| :--- | :--- |
| 📜 `hardhat-env` | Smart contracts, tests, and deployment (Hardhat + Solidity + OpenZeppelin + viem). |
| 🖥️ `next-env` | Web frontend (Next.js + shadcn/ui + wagmi/viem + Reown) for producers and consumers. |

---

## 🚀 Getting started

Each workspace manages its own dependencies with **pnpm**.

### 📜 Smart contracts

```bash
cd hardhat-env
pnpm install
pnpm hardhat compile
pnpm hardhat test
```

### 🖥️ Frontend

```bash
cd next-env
pnpm install
pnpm dev
```

Then open **http://localhost:3000**.

> ℹ️ The frontend expects environment variables (RPC URL, Reown project ID,
> Etherscan API key, contract addresses) in `next-env/.env.local`. See
> `.env.example` for the required keys.

---

## 📌 Status

> 🚧 **Early development** — this project is a work in progress. Contributions,
> ideas, and feedback are welcome.

---

<div align="center">

**Krither** · Bringing blockchain transparency to the makers who feed and craft our world.

</div>
