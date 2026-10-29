import { Component, useEffect, useId, useRef, useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { money, pct } from '../utils/format.js';

export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="AURA CAPITAL logo">
      <polygon points="24,4 29,4 42,44 37,44" fill="#1e4fa8" />
      <polygon points="14,32 35,32 36.6,36.5 12.4,36.5" fill="#1e4fa8" />
      <polygon points="11.4,32 16.4,32 11,44 6,44" fill="#1e4fa8" />
      <polygon points="24,4 29,4 16.4,32 11.4,32" fill="#2dd4d0" />
    </svg>
  );
}

const FOCUSABLE = 'button:not([disabled]),[href],select,input,[tabindex]:not([tabindex="-1"])';
export function Modal({ title, onClose, children }) {
  const ref = useRef(null), closeRef = useRef(onClose), id = useId();
  closeRef.current = onClose; // keep effect stable across live re-renders
  useEffect(() => {
    const el = ref.current, prev = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    el.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const f = [...el.querySelectorAll(FOCUSABLE)];
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || at === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; if (prev?.isConnected) prev.focus(); };
  }, []);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} ref={ref}>
        <div className="modal-head"><h2 id={id}>{title}</h2>
          <button className="icon-btn" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function AnimatedMoney({ value }) {
  const [shown, setShown] = useState(value), from = useRef(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) { from.current = value; setShown(value); return undefined; }
    const start = performance.now(), a = from.current; let raf;
    const step = (now) => {
      const k = Math.min((now - start) / 400, 1), v = a + (value - a) * k;
      from.current = v; setShown(v); if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="num">{money(Math.abs(shown) < 0.005 ? 0 : shown)}</span>;
}

export function Delta({ cur, prev, label = 'vs previous period', invert = false }) {
  const d = cur - prev, p = prev === 0 ? null : (d / Math.abs(prev)) * 100;
  const state = Math.abs(d) < 0.005 ? 'neutral' : (d > 0) !== invert ? 'pos' : 'neg';
  const Icon = state === 'neutral' ? Minus : d > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`delta ${state}`}><Icon size={14} aria-hidden /> {money(Math.abs(d))} ({pct(p)}) <span className="muted">{label}</span></span>;
}

export class ErrorBoundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    return this.state.err
      ? <div className="panel" role="alert"><h2>Something went wrong</h2><p className="muted">This view failed to render. Reload the page to try again.</p>
        <button className="btn" onClick={() => this.setState({ err: null })}>Try again</button></div>
      : this.props.children;
  }
}
