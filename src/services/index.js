import { DATA_SOURCE, LIVE_INTERVAL_MS } from '../config/index.js';
import { ANCHOR, makeHoldings, makeTransactions, tickHoldings } from '../data/mock.js';
// Provider contract: {label, simulated, now, getHoldings(), getTransactions(), subscribe(apply)->unsubscribe}
const mockProvider = {
  label: 'Simulated demo data', simulated: true, now: ANCHOR,
  getHoldings: async () => makeHoldings(), getTransactions: async () => makeTransactions(),
  subscribe(apply) {
    let n = 0;
    const id = setInterval(() => { if (!document.hidden) { n += 1; const k = n; apply((hs) => tickHoldings(hs, k)); } }, LIVE_INTERVAL_MS);
    return () => clearInterval(id);
  },
};
const unconfigured = { ...mockProvider, simulated: false,
  getHoldings: async () => { throw new Error('API provider is not configured. See README: backend setup.'); },
  getTransactions: async () => { throw new Error('API provider is not configured.'); } };
export const provider = DATA_SOURCE === 'mock' ? mockProvider : unconfigured;
