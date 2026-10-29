const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n) => usd.format(n);
export const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const pct = (n) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`);
const opt = { timeZone: 'UTC' }; // all dates shown in UTC for consistency
export const dateShort = (t) => new Date(t).toLocaleDateString('en-US', { ...opt, month: 'short', day: 'numeric' });
export const dateTime = (t) => new Date(t).toLocaleString('en-US', { ...opt, dateStyle: 'medium', timeStyle: 'short' }) + ' UTC';
