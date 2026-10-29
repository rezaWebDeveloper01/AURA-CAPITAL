import { useCallback, useEffect, useState } from 'react';
export function useDashboard(provider) {
  const [state, setState] = useState({ status: 'loading', holdings: [], txs: [], error: null });
  const [live, setLive] = useState(false);
  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const [holdings, txs] = await Promise.all([provider.getHoldings(), provider.getTransactions()]);
      setState({ status: 'ready', holdings, txs, error: null });
    } catch (e) { setState((s) => ({ ...s, status: 'error', error: e.message })); }
  }, [provider]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!live || state.status !== 'ready') return undefined;
    return provider.subscribe((fn) => setState((s) => ({ ...s, holdings: fn(s.holdings) })));
  }, [live, state.status, provider]);
  return { ...state, live, setLive, reload: load };
}
