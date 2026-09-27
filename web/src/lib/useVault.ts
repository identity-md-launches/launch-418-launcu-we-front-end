import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyDeposit,
  applyWithdraw,
  initialState,
  loadState,
  saveState,
  totals,
  type DepositQuote,
  type VaultState,
  type WithdrawQuote,
} from './vault';

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function useVault() {
  const [state, setState] = useState<VaultState>(() => loadState(storage()));

  useEffect(() => {
    saveState(storage(), state);
  }, [state]);

  const deposit = useCallback((quote: DepositQuote) => {
    setState((s) => applyDeposit(s, quote));
  }, []);

  const withdraw = useCallback((quote: WithdrawQuote) => {
    setState((s) => applyWithdraw(s, quote));
  }, []);

  const reset = useCallback(() => {
    setState(initialState());
  }, []);

  const summary = useMemo(() => totals(state), [state]);

  return { state, summary, deposit, withdraw, reset };
}
