// Pure financial calculations. All amounts are USD (simplification, see README).
export const DAY = 864e5;
export const RANGES = { '7D': 7, '30D': 30, '90D': 90, '12M': 365 };
export const round2 = (n) => Math.round(n * 100) / 100;
export const pctChange = (cur, prev) => (prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);
const counted = (t) => t.status === 'completed'; // pending/failed never affect totals
const ts = (t) => Date.parse(t.date);
const SIGN = { deposit: 1, income: 1, withdrawal: -1, expense: -1 };

// Windows are (from, to] so adjacent windows partition time with no double counting.
export const windowsFor = (now, days) => ({
  cur: { from: now - days * DAY, to: now },
  prev: { from: now - 2 * days * DAY, to: now - days * DAY },
});

export function totals(txs, w) {
  const r = { deposit: 0, withdrawal: 0, income: 0, expense: 0, fees: 0 };
  for (const t of txs) {
    const x = ts(t);
    if (!counted(t) || !(x > w.from && x <= w.to)) continue;
    r[t.type] += t.amount;
    r.fees += t.fee || 0;
  }
  for (const k in r) r[k] = round2(r[k]);
  r.profit = round2(r.income - r.expense - r.fees); // cash-basis: income - expenses - fees
  return r;
}

export function priceAt(h, t) {
  const a = h.history;
  if (t < a[0].t) return { p: a[0].p, partial: true }; // missing history: earliest known price
  let lo = 0, hi = a.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m].t <= t) lo = m; else hi = m - 1; }
  return { p: a[lo].p, partial: false };
}
export const currentPrice = (h) => h.history[h.history.length - 1].p;
export const holdingValue = (h) => h.qty * currentPrice(h);
export const portfolioValueAt = (hs, t) => hs.reduce((s, h) => s + h.qty * priceAt(h, t).p, 0);

export function cashAt(txs, t) {
  let c = 0;
  for (const x of txs) if (counted(x) && ts(x) <= t) c += SIGN[x.type] * x.amount - (x.fee || 0);
  return c;
}
export const balanceAt = (hs, txs, t) => round2(portfolioValueAt(hs, t) + cashAt(txs, t));

export function bucketSeries(txs, now, days) {
  const size = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  const from = now - days * DAY, n = Math.ceil(days / size), out = [];
  for (let i = 0; i < n; i++) {
    const a = from + i * size * DAY, b = Math.min(a + size * DAY, now);
    const w = totals(txs, { from: a, to: b });
    out.push({ t: b, deposits: w.deposit, withdrawals: -w.withdrawal, income: w.income, expenses: w.expense });
  }
  return out;
}

export function allocation(hs) {
  const total = hs.reduce((s, h) => s + holdingValue(h), 0);
  return hs.map((h) => ({ id: h.id, name: h.name, value: round2(holdingValue(h)), pct: total ? (holdingValue(h) / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function assetPerformance(hs, from) {
  return hs.map((h) => {
    const { p, partial } = priceAt(h, from), cur = currentPrice(h);
    return { id: h.id, name: h.name, symbol: h.symbol, partial,
      periodChange: round2((cur - p) * h.qty), periodPct: pctChange(cur, p),
      unrealized: round2((cur - h.avgCost) * h.qty), unrealizedPct: pctChange(cur, h.avgCost) };
  });
}

export function buildMetrics(hs, txs, now, days) {
  const w = windowsFor(now, days), cur = totals(txs, w.cur), prev = totals(txs, w.prev);
  const alloc = allocation(hs), perf = assetPerformance(hs, w.cur.from);
  const timeline = hs[0].history.filter((p) => p.t >= w.cur.from && p.t <= now).map((p) => p.t);
  const performance = timeline.map((t) => ({ t, value: round2(portfolioValueAt(hs, t)) }));
  const start = performance[0]?.value ?? 0, end = performance.at(-1)?.value ?? 0;
  const buckets = bucketSeries(txs, now, days);
  return {
    cur, prev, alloc, perf,
    balance: { cur: balanceAt(hs, txs, now), prev: balanceAt(hs, txs, w.cur.from) },
    portfolioValue: round2(hs.reduce((s, h) => s + holdingValue(h), 0)), // round once, never sum rounded parts
    performance, perfSummary: { start, end, change: round2(end - start), pct: pctChange(end, start) },
    cashFlow: buckets, largest: alloc[0],
    losses: perf.filter((p) => p.periodChange < 0).sort((a, b) => a.periodChange - b.periodChange),
    ranking: [...perf].sort((a, b) => b.periodChange - a.periodChange),
  };
}
