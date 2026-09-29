# Bean Stalk DApp Frontend

React + TypeScript + Vite frontend for the Bean Stalk contracts (`../backend`). No styling/theme applied — functionality only.

Uses `ethers` v6 and `window.ethereum` (MetaMask) directly, no wallet-connector library.

## Setup

```bash
npm install
cp .env.example .env   # defaults already point to the deployed Sepolia addresses
npm run dev
```

Connect a wallet on **Sepolia** (chain ID 11155111). The app prompts to switch networks if needed.

## Routes

Each contract has its own page (client-side routed via `react-router-dom`):

- `/` — home, links to the three contracts.
- `/bean` — Discrete Bean (BEAN token).
- `/farm` — Regular Farm (staking pool).
- `/beanstalk` — Bean Stalk (prediction market).

Wallet connection lives in the shared `Layout` and is passed down to pages via `Outlet` context, so it stays connected while navigating between routes. A production static host needs SPA fallback (rewrite all paths to `index.html`) for deep links to work — Vite's own dev/preview servers already do this.

## Structure

- `src/abis/` — ABIs copied from `backend/artifacts/contracts/**/*.json` (`DiscreteBean`, `RegularFarm`, `BeanStalk`).
- `src/config/contracts.ts` — deployed contract addresses (overridable via `VITE_*` env vars).
- `src/hooks/useWallet.ts` — MetaMask connect/disconnect, account & chain tracking, network switch.
- `src/hooks/useContracts.ts` — builds `ethers.Contract` instances for the three contracts.
- `src/components/Layout.tsx` — nav + wallet connect shell, provides wallet/contracts via `Outlet` context.
- `src/pages/` — one route per contract, each just wires `useOutletContext` into its panel:
  - `BeanPage` → `BeanTokenPanel` — balance, transfer, approve, burn, mint (only shown if the connected account holds `MINTER_ROLE`).
  - `FarmPage` → `RegularFarmPanel` — stake (approves + stakes full balance), unstake, claim.
  - `BeanStalkPage` → `BeanStalkPanel` — stake/unstake a chosen amount, predict higher/lower, manual price refresh, view current price/earnings.

## Notes

- BEAN has 0 decimals (whole-number token), so amounts are entered/displayed as plain integers.
- Re-run `backend`'s ABI export if the contracts change: the ABIs here are a snapshot, not symlinked.
- If contracts are redeployed, update `.env` (or `src/config/contracts.ts` defaults).
