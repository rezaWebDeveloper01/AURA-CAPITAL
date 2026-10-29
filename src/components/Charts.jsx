import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compact, dateShort, money, pct } from '../utils/format.js';

const COLORS = ['#2dd4d0', '#1e4fa8', '#7dd3fc', '#5b7bb5', '#14907f', '#a5b4cf'];
const axis = { stroke: '#7d8ba3', fontSize: 12 };
const Box = ({ title, children, note }) => <section className="panel" aria-label={title}><h2>{title}</h2><div className="chart">{children}</div>{note && <p className="muted small">{note}</p>}</section>;
const tip = { contentStyle: { background: '#0f1826', border: '1px solid #26364f', borderRadius: 8 }, labelFormatter: dateShort };

export default function Charts({ m }) {
  const [mode, setMode] = useState('value');
  const base = m.perfSummary.start;
  const perf = m.performance.map((p) => ({ t: p.t, value: p.value, ret: base ? (p.value / base - 1) * 100 : 0 }));
  return (
    <div className="grid charts">
      <section className="panel wide" aria-label="Portfolio performance">
        <div className="row between"><h2>Portfolio performance</h2>
          <div role="group" aria-label="Performance units">{[['value', 'Value'], ['ret', '% return']].map(([k, l]) =>
            <button key={k} className="chip" aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}</div></div>
        <p className="muted small">{money(m.perfSummary.start)} → {money(m.perfSummary.end)} ({pct(m.perfSummary.pct)})</p>
        <div className="chart"><ResponsiveContainer><AreaChart data={perf}>
          <CartesianGrid stroke="#1c2a40" vertical={false} /><XAxis dataKey="t" tickFormatter={dateShort} {...axis} minTickGap={32} />
          <YAxis tickFormatter={mode === 'value' ? compact : (v) => `${v.toFixed(0)}%`} {...axis} width={56} domain={['auto', 'auto']} />
          <Tooltip {...tip} formatter={(v) => [mode === 'value' ? money(v) : pct(v), mode === 'value' ? 'Value' : 'Return']} />
          <Area type="monotone" dataKey={mode} stroke="#2dd4d0" fill="#2dd4d0" fillOpacity={0.12} isAnimationActive={false} />
        </AreaChart></ResponsiveContainer></div></section>
      <Box title="Asset allocation"><ResponsiveContainer><PieChart>
        <Pie data={m.alloc} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" isAnimationActive={false}>
          {m.alloc.map((a, i) => <Cell key={a.id} fill={COLORS[i % COLORS.length]} />)}</Pie>
        <Tooltip contentStyle={tip.contentStyle} formatter={(v, n, { payload }) => [`${money(v)} (${payload.pct.toFixed(1)}%)`, n]} />
        <Legend formatter={(n) => n} /></PieChart></ResponsiveContainer></Box>
      <Box title="Cash flow" note="Deposits above the axis, withdrawals below. Completed transactions only."><ResponsiveContainer><BarChart data={m.cashFlow} stackOffset="sign">
        <CartesianGrid stroke="#1c2a40" vertical={false} /><XAxis dataKey="t" tickFormatter={dateShort} {...axis} minTickGap={24} /><YAxis tickFormatter={compact} {...axis} width={48} />
        <Tooltip {...tip} formatter={(v, n) => [money(Math.abs(v)), n]} /><Legend />
        <Bar dataKey="deposits" name="Deposits" stackId="a" fill="#2dd4d0" isAnimationActive={false} />
        <Bar dataKey="withdrawals" name="Withdrawals" stackId="a" fill="#e0617a" isAnimationActive={false} /></BarChart></ResponsiveContainer></Box>
      <Box title="Income and expenses"><ResponsiveContainer><BarChart data={m.cashFlow}>
        <CartesianGrid stroke="#1c2a40" vertical={false} /><XAxis dataKey="t" tickFormatter={dateShort} {...axis} minTickGap={24} /><YAxis tickFormatter={compact} {...axis} width={48} />
        <Tooltip {...tip} formatter={(v, n) => [money(v), n]} /><Legend />
        <Bar dataKey="income" name="Income" fill="#2dd4d0" isAnimationActive={false} />
        <Bar dataKey="expenses" name="Expenses" fill="#5b7bb5" isAnimationActive={false} /></BarChart></ResponsiveContainer></Box>
    </div>
  );
}
