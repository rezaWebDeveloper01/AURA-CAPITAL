import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, LayoutDashboard, Wallet, ArrowLeftRight, LineChart, Landmark, Settings, Menu, User, LogOut } from 'lucide-react';
import { Logo, Modal } from './ui.jsx';
import { dateTime, money } from '../utils/format.js';

export const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/portfolio', 'Portfolio', Wallet], ['/transactions', 'Transactions', ArrowLeftRight],
  ['/analytics', 'Analytics', LineChart], ['/investments', 'Investments', Landmark], ['/settings', 'Settings', Settings],
];

export function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <>
      {open && <div className="scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary">
        <div className="side-logo"><Logo size={40} /></div>
        <nav><ul>{NAV.map(([to, label, Icon]) => (
          <li key={to}><NavLink to={to} end={to === '/'} className={({ isActive }) => `nav ${isActive ? 'active' : ''}`}><Icon size={18} aria-hidden /> {label}</NavLink></li>))}</ul></nav>
        <div className="side-logo bottom"><Logo size={56} /></div>
      </aside>
    </>
  );
}

export function Header({ title, notifications, onMenu, onLogout }) {
  const [modal, setModal] = useState(null), [menu, setMenu] = useState(false), box = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const out = (e) => !box.current?.contains(e.target) && setMenu(false);
    const k = (e) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', out); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', k); };
  }, [menu]);
  const close = () => setModal(null);
  return (
    <header className="header">
      <button className="icon-btn menu-btn" aria-label="Open navigation" onClick={onMenu}><Menu size={20} /></button>
      <div className="brand"><Logo size={26} /><span>AURA CAPITAL</span></div>
      <span className="divider" aria-hidden /><h1>{title}</h1>
      <div className="spacer" />
      <button className="icon-btn" aria-label={`Notifications, ${notifications.length} items`} onClick={() => setModal('notes')}>
        <Bell size={18} />{notifications.length > 0 && <span className="dot" aria-hidden />}</button>
      <div className="profile" ref={box}>
        <button className="avatar" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><User size={18} /><span className="sr">Account menu</span></button>
        {menu && <div className="popover" role="menu">
          <button role="menuitem" onClick={() => { setMenu(false); setModal('profile'); }}><User size={15} /> Profile</button>
          <button role="menuitem" onClick={() => { setMenu(false); setModal('logout'); }}><LogOut size={15} /> Log out</button></div>}
      </div>
      {modal === 'notes' && <Modal title="Notifications" onClose={close}>
        {notifications.length === 0 ? <p className="muted">You’re all caught up. Pending or failed transactions will appear here.</p>
          : <ul className="plain">{notifications.map((n) => <li key={n.id}><strong>{n.status === 'failed' ? 'Failed' : 'Pending'} {n.type}</strong> of {money(n.amount)}
            <div className="muted">{n.counterparty} · {dateTime(n.date)}</div></li>)}</ul>}</Modal>}
      {modal === 'profile' && <Modal title="Profile" onClose={close}><p className="muted">Demo session. Account details require an authentication provider, which is not configured.</p>
        <button className="btn" data-autofocus onClick={close}>Close</button></Modal>}
      {modal === 'logout' && <Modal title="Log out?" onClose={close}><p>You’ll end this demo session.</p>
        <div className="row"><button className="btn ghost" onClick={close}>Cancel</button>
          <button className="btn danger" onClick={() => { close(); onLogout(); }}>Log out</button></div></Modal>}
    </header>
  );
}
