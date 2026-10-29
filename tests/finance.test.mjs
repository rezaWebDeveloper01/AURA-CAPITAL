import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMetrics, totals, windowsFor, RANGES, balanceAt, cashAt, portfolioValueAt, round2, pctChange, DAY } from '../src/utils/finance.js';
import { ANCHOR, makeHoldings, makeTransactions, tickHoldings } from '../src/data/mock.js';
const hs = makeHoldings(), txs = makeTransactions();
for (const [name, d] of Object.entries(RANGES)) {
  test(`consistency ${name}`, () => {
    const m = buildMetrics(hs, txs, ANCHOR, d), w = windowsFor(ANCHOR, d);
    assert.ok(Math.abs(m.alloc.reduce((s, a) => s + a.pct, 0) - 100) < 1e-9);
    assert.ok(Math.abs(m.portfolioValue - hs.reduce((s, h) => s + h.qty * h.history.at(-1).p, 0)) < 0.05);
    assert.equal(m.performance.at(-1).value, round2(portfolioValueAt(hs, ANCHOR)));
    assert.ok(m.performance.every((p, i, a) => i === 0 || p.t > a[i - 1].t));
    const sum = (k) => round2(m.cashFlow.reduce((s, b) => s + Math.abs(b[k]), 0));
    assert.equal(sum('deposits'), m.cur.deposit); assert.equal(sum('withdrawals'), m.cur.withdrawal);
    assert.equal(sum('income'), m.cur.income); assert.equal(sum('expenses'), m.cur.expense);
    assert.equal(m.cur.profit, round2(m.cur.income - m.cur.expense - m.cur.fees));
    const dCash = round2(cashAt(txs, w.cur.to) - cashAt(txs, w.cur.from));
    assert.equal(dCash, round2(m.cur.deposit + m.cur.income - m.cur.withdrawal - m.cur.expense - m.cur.fees));
    assert.ok(Math.abs(m.balance.cur - m.balance.prev - dCash - m.perfSummary.change) < 0.05);
    assert.ok(m.losses.every((l) => l.periodChange < 0));
    assert.equal(m.largest.id, [...m.alloc].sort((a, b) => b.value - a.value)[0].id);
  });
}
test('windows partition: 30D + previous 30D = 60D', () => {
  const a = totals(txs, windowsFor(ANCHOR, 30).cur), b = totals(txs, windowsFor(ANCHOR, 30).prev);
  const c = totals(txs, { from: ANCHOR - 60 * DAY, to: ANCHOR });
  assert.equal(round2(a.income + b.income), c.income);
});
test('pending and failed never counted', () => {
  const t = [{ type: 'income', amount: 100, fee: 0, status: 'pending', date: new Date(ANCHOR - DAY).toISOString() }];
  assert.equal(totals(t, windowsFor(ANCHOR, 7).cur).income, 0);
});
test('pctChange zero previous is null', () => assert.equal(pctChange(5, 0), null));
test('live tick updates dependents consistently, deterministic, no mutation', () => {
  const before = hs[0].history.at(-1).p, h2 = tickHoldings(hs, 1), m = buildMetrics(h2, txs, ANCHOR, 30);
  assert.notEqual(m.portfolioValue, buildMetrics(hs, txs, ANCHOR, 30).portfolioValue);
  assert.equal(m.performance.at(-1).value, m.portfolioValue);
  assert.equal(balanceAt(h2, txs, ANCHOR), m.balance.cur);
  assert.deepEqual(tickHoldings(hs, 1)[0].history.at(-1), h2[0].history.at(-1));
  assert.equal(hs[0].history.at(-1).p, before);
});
