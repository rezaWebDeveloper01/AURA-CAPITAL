import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowDownUp, Radio } from 'lucide-react';
import { AnimatedMoney, Delta, Modal } from '../components/ui.jsx';
import { RANGES, buildMetrics, round2 } from '../utils/finance.js';
import { dateTime, money, pct } from '../utils/format.js';

const Charts = lazy(() => import('../components/Charts.jsx'));
const PAGE = 8;

function Card({ title, children }) { return <section className="card" aria-label={title}><h3>{title}</h3>{children}</section>; }

function AssetModal({ a, onClose }) {
  const p = a.perf;
  return (
    <Modal title={a.alloc.name} onClose={onClose}>
      <dl className="kv">
        <dt>Current value</dt><dd>{money(a.alloc.value)}</dd>
        <dt>Portfolio allocation</dt><dd>{a.alloc.pct.toFixed(2)}%</dd>
        <dt>Change in selected period</dt><dd>{money(p.periodChange)} ({pct(p.periodPct)})</dd>
        <dt>Unrealized since average cost</dt><dd>{money(p.unrealized)} ({pct(p.unrealizedPct)})</dd>
        <dt>Realized gains and losses</dt><dd className="muted">Not available in demo data</dd>
      </dl>
      {p.partial && <p className="muted small">Price history starts after the period began, so the earliest known price was used.</p>}
    </Modal>
  );
}

function Transactions({ txs }) {
  const [type, setType] = useState('all'), [status, setStatus] = useState('all');
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' }), [limit, setLimit] = useState(PAGE), [sel, setSel] = useState(null);
  const rows = useMemo(() => {
    const f = txs.filter((t) => (type === 'all' || t.type === type) && (status === 'all' || t.status === status));
    const v = (t) => (sort.key === 'date' ? Date.parse(t.date) : t.amount), k = sort.dir === 'asc' ? 1 : -1;
    return f.sort((a, b) => (v(a) - v(b)) * k || a.id.localeCompare(b.id));
  }, [txs, type, status, sort]);
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  const reset = () => { setType('all'); setStatus('all'); setLimit(PAGE); };
  const Icon = (t) => (t === 'deposit' || t === 'income' ? ArrowDownLeft : ArrowUpRight);
  return (
    <section className="panel" aria-label="Recent transactions">
      <div className="row between wrap"><h2>Recent transactions</h2>
        <div className="row wrap">
          <label className="field">Type <select value={type} onChange={(e) => { setType(e.target.value); setLimit(PAGE); }}>
            {['all', 'deposit', 'withdrawal', 'income', 'expense'].map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="field">Status <select value={status} onChange={(e) => { setStatus(e.target.value); setLimit(PAGE); }}>
            {['all', 'completed', 'pending', 'failed'].map((o) => <option key={o}>{o}</option>)}</select></label>
          <button className="chip" onClick={() => toggle('date')}><ArrowDownUp size={14} /> Date {sort.key === 'date' ? sort.dir : ''}</button>
          <button className="chip" onClick={() => toggle('amount')}><ArrowDownUp size={14} /> Amount {sort.key === 'amount' ? sort.dir : ''}</button></div></div>
      {rows.length === 0 ? <div className="empty"><p>No transactions match these filters.</p><button className="btn" onClick={reset}>Clear filters</button></div> : (
        <div className="scroll"><table><thead><tr><th>Type</th><th>Counterparty</th><th>Date</th><th className="r">Amount</th><th>Status</th></tr></thead>
          <tbody>{rows.slice(0, limit).map((t) => { const I = Icon(t.type); return (
            <tr key={t.id}><td><button className="link" onClick={() => setSel(t)} aria-label={`View ${t.type} of ${money(t.amount)}`}><I size={14} aria-hidden /> {t.type}</button></td>
              <td>{t.counterparty}</td><td>{dateTime(t.date)}</td>
              <td className="r">{t.type === 'withdrawal' || t.type === 'expense' ? '−' : '+'}{money(t.amount)}</td><td><span className={`badge ${t.status}`}>{t.status}</span></td></tr>); })}</tbody></table></div>)}
      {rows.length > limit && <button className="btn ghost" onClick={() => setLimit((l) => l + PAGE)}>Show more ({rows.length - limit} left)</button>}
      {sel && <Modal title="Transaction details" onClose={() => setSel(null)}><dl className="kv">
        <dt>Type</dt><dd>{sel.type}</dd><dt>Counterparty</dt><dd>{sel.counterparty}</dd><dt>Date</dt><dd>{dateTime(sel.date)}</dd>
        <dt>Amount</dt><dd>{money(sel.amount)} {sel.currency}</dd><dt>Fee</dt><dd>{money(sel.fee)}</dd><dt>Status</dt><dd>{sel.status}</dd><dt>ID</dt><dd>{sel.id}</dd></dl>
        <p className="muted small">Simulated record. Not confirmed on-chain.</p></Modal>}
    </section>
  );
}

export default function Dashboard({ data, provider }) {
  const { status, holdings, txs, error, live, setLive, reload } = data;
  const [range, setRange] = useState('30D'), [asset, setAsset] = useState(null);
  const m = useMemo(() => (status === 'ready' ? buildMetrics(holdings, txs, provider.now, RANGES[range]) : null), [status, holdings, txs, provider.now, range]);
  if (status === 'error') return <div className="panel" role="alert"><h2>Data unavailable</h2><p className="muted">{error}</p><button className="btn" onClick={reload}>Retry</button></div>;
  if (!m) return <div className="panel" aria-busy="true"><p className="muted">Loading portfolio…</p></div>;
  const open = (id) => setAsset({ alloc: m.alloc.find((a) => a.id === id), perf: m.perf.find((a) => a.id === id) });
  return (
    <div className="stack">
      <div className="row between wrap">
        <p className="banner"><Radio size={14} aria-hidden /> {provider.label}{provider.simulated ? ' — not real account data' : ''}</p>
        <div className="row wrap">
          <div role="group" aria-label="Period">{Object.keys(RANGES).map((k) => <button key={k} className="chip" aria-pressed={range === k} onClick={() => setRange(k)}>{k}</button>)}</div>
          <button className="chip" aria-pressed={live} onClick={() => setLive(!live)}>{live ? 'Simulated updates on' : 'Simulated updates off'}</button></div></div>
      <div className="grid cards">
        <Card title="Total account balance"><AnimatedMoney value={m.balance.cur} /><Delta cur={m.balance.cur} prev={m.balance.prev} /></Card>
        <Card title={`Income (${range})`}><AnimatedMoney value={m.cur.income} /><Delta cur={m.cur.income} prev={m.prev.income} /></Card>
        <Card title={`Profit or loss (${range})`}><AnimatedMoney value={m.cur.profit} /><Delta cur={m.cur.profit} prev={m.prev.profit} />
          <p className="muted small">Income − expenses − fees, cash basis. Excludes unrealized holdings changes.</p></Card>
        <Card title={`Deposits and withdrawals (${range})`}>
          <p className="in"><ArrowDownLeft size={14} aria-hidden /> Deposited <AnimatedMoney value={m.cur.deposit} /></p>
          <p className="out"><ArrowUpRight size={14} aria-hidden /> Withdrawn <AnimatedMoney value={m.cur.withdrawal} /></p>
          <p className="muted small">Net {money(round2(m.cur.deposit - m.cur.withdrawal))}</p></Card>
        <Card title="Largest investment"><button className="link big" onClick={() => open(m.largest.id)}>{m.largest.name}</button>
          <AnimatedMoney value={m.largest.value} /><p className="muted small">{m.largest.pct.toFixed(1)}% of portfolio · {pct(m.perf.find((p) => p.id === m.largest.id).periodPct)} in {range}</p></Card>
        <Card title={`Largest losses (${range})`}>{m.losses.length === 0 ? <p className="muted">No losses in this period.</p> :
          <ul className="plain">{m.losses.slice(0, 3).map((l) => <li key={l.id}><button className="link" onClick={() => open(l.id)}>{l.name}</button>
            <span className="neg"> {money(l.periodChange)} ({pct(l.periodPct)})</span></li>)}</ul>}
          <p className="muted small">Unrealized (price change). Realized losses unavailable in demo data.</p></Card>
      </div>
      <Suspense fallback={<div className="panel" aria-busy="true"><p className="muted">Loading charts…</p></div>}><Charts m={m} /></Suspense>
      <section className="panel" aria-label="Asset performance"><h2>Asset performance ({range})</h2>
        <ul className="plain">{m.ranking.map((r) => <li key={r.id} className="row between"><button className="link" onClick={() => open(r.id)}>{r.name}</button>
          <span className={r.periodChange < 0 ? 'neg' : 'pos'}>{money(r.periodChange)} ({pct(r.periodPct)})</span></li>)}</ul></section>
      <Transactions txs={txs} />
      {asset && <AssetModal a={asset} onClose={() => setAsset(null)} />}
    </div>
  );
}
