// SIMULATED demo data (deterministic). Not real account or on-chain data.
import { DAY } from '../utils/finance.js';
export const ANCHOR = Date.UTC(2026, 9, 29, 12);
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const SPEC = [
  ['eth', 'Ethereum', 'ETH', 'Crypto', 12.5, 2100, 3200, 0.05], ['btc', 'Bitcoin', 'BTC', 'Crypto', 0.8, 52000, 68000, 0.04],
  ['sol', 'Solana', 'SOL', 'Crypto', 140, 190, 150, 0.07], ['lp', 'USDC/ETH Pool', 'LP-1', 'Liquidity', 9000, 1, 1.04, 0.004],
  ['aave', 'Aave', 'AAVE', 'DeFi', 45, 160, 128, 0.06], ['tbill', 'Tokenized T-Bills', 'TBILL', 'Fixed income', 20000, 1, 1.03, 0.0008],
];
export function makeHoldings() {
  const r = rng(11);
  return SPEC.map(([id, name, symbol, category, qty, avgCost, end, vol]) => {
    const history = []; let p = end;
    for (let i = 365; i >= 0; i--) { history[i] = { t: ANCHOR - (365 - i) * DAY, p: Math.max(p, 0.0001) }; p = p / (1 + (r() - 0.5) * vol); }
    return { id, name, symbol, category, qty, avgCost, history };
  });
}
export function makeTransactions() {
  const r = rng(7), types = ['deposit', 'withdrawal', 'income', 'income', 'expense', 'expense'];
  const who = { deposit: 'Bank transfer', withdrawal: 'Bank payout', income: 'Staking rewards', expense: 'Platform services' };
  return Array.from({ length: 80 }, (_, i) => {
    const type = types[Math.floor(r() * types.length)], x = r();
    const amount = Math.round((type === 'deposit' || type === 'withdrawal' ? 500 + r() * 6000 : 20 + r() * 900) * 100) / 100;
    return { id: `demo-${i + 1}`, type, counterparty: who[type], amount, currency: 'USD',
      fee: type === 'deposit' || type === 'withdrawal' ? Math.round(amount * 0.002 * 100) / 100 : 0,
      status: x < 0.86 ? 'completed' : x < 0.94 ? 'pending' : 'failed',
      date: new Date(ANCHOR - Math.floor(r() * 400 * 24 * 36) * 100000).toISOString() };
  }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
// Live tick: mutates the underlying prices first; every metric is then recomputed from them.
export function tickHoldings(hs, n) {
  const r = rng(n * 7919 + 1);
  return hs.map((h) => {
    const hist = h.history.slice(), last = hist[hist.length - 1];
    hist[hist.length - 1] = { t: last.t, p: Math.max(last.p * (1 + (r() - 0.5) * 0.01), 0.0001) };
    return { ...h, history: hist };
  });
}
