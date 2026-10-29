# AURA CAPITAL — Portfolio Dashboard (demo)
React + Vite + Recharts + React Router + Lucide. **All data is simulated**; nothing is on-chain or from a real account.

## Run
`npm install` → `npm run dev` · `npm run build` · `npm run lint` · `npm test` (calculation tests, no dependencies needed)

## Structure
`src/utils/finance.js` (all calculations, pure) · `src/data/mock.js` (deterministic demo data) · `src/services/index.js` (provider contract) · `src/hooks/useDashboard.js` · `src/components` · `src/pages` · `src/config`

## Data model and assumptions
- Holdings: `qty`, `avgCost`, daily `history` of prices. Value = qty × latest price. Everything else is derived from holdings + transactions (one source of truth).
- Only `completed` transactions count. Windows are (from, to], so previous/current periods never double count.
- Profit = income − expenses − fees (cash basis). Unrealized change is shown separately. Balance = cash from transactions + holdings value (asset purchases are not modeled as cash movements).
- Single currency (USD); dates displayed in UTC; missing early price history falls back to the earliest known price and is flagged.
- Realized losses: unavailable (no trade data).

## Simulated live updates
Toggle “Simulated updates”. Every 3 s (paused when the tab is hidden) the provider changes holding prices, then all cards and charts recompute from them. Timers are cleaned up on toggle/unmount.

## Real data
Set `VITE_DATA_SOURCE=api` and implement the provider contract in `src/services/index.js` (`getHoldings`, `getTransactions`, `subscribe`). Until then the UI shows a retryable "not configured" state. Wallet/contract integration is **pending**: needs contract address, ABI, chain ID. Never put secrets in `VITE_*` variables.

## Known limitations
Placeholder pages for Portfolio/Transactions/Analytics/Investments/Settings; no auth backend (logout ends the demo session only); not yet built/linted/browser-tested (see below).
