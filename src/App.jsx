import { Suspense, useCallback, useMemo, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Header, NAV, Sidebar } from './components/Layout.jsx';
import { ErrorBoundary, Logo } from './components/ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { useDashboard } from './hooks/useDashboard.js';
import { provider } from './services/index.js';

const Placeholder = ({ title }) => <div className="panel"><h2>{title}</h2><p className="muted">This page isn’t built yet. It will use the same data layer as the dashboard.</p></div>;

export default function App() {
  const data = useDashboard(provider), [nav, setNav] = useState(false), [out, setOut] = useState(false), { pathname } = useLocation();
  const closeNav = useCallback(() => setNav(false), []);
  const notifications = useMemo(() => data.txs.filter((t) => t.status !== 'completed').slice(0, 10), [data.txs]);
  const title = NAV.find(([to]) => to === pathname)?.[1] ?? 'Not found';
  if (out) return <div className="signed-out"><Logo size={64} /><h1>You’re logged out</h1><p className="muted">Demo session ended.</p><button className="btn" onClick={() => setOut(false)}>Start a new demo session</button></div>;
  return (
    <div className="shell">
      <Sidebar open={nav} onClose={closeNav} />
      <div className="main">
        <Header title={title} notifications={notifications} onMenu={() => setNav(true)} onLogout={() => setOut(true)} />
        <main className="content"><ErrorBoundary key={pathname}><Suspense fallback={null}><Routes>
          <Route path="/" element={<Dashboard data={data} provider={provider} />} />
          {NAV.slice(1).map(([to, label]) => <Route key={to} path={to} element={<Placeholder title={label} />} />)}
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes></Suspense></ErrorBoundary></main>
      </div>
    </div>
  );
}
