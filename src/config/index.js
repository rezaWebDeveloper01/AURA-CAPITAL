// Non-secret config only. Never put keys or private keys in frontend env vars.
export const DATA_SOURCE = import.meta.env?.VITE_DATA_SOURCE ?? 'mock';
export const LIVE_INTERVAL_MS = 3000;
