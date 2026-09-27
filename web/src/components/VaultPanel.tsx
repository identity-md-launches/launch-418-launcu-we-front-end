import { useId, useRef, type KeyboardEvent } from 'react';
import type { DepositQuote, VaultState, WithdrawQuote } from '../lib/vault';
import { DepositForm } from './DepositForm';
import { WithdrawForm } from './WithdrawForm';

export type VaultTab = 'deposit' | 'withdraw';

interface Props {
  state: VaultState;
  tab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
  onDeposit: (quote: DepositQuote) => void;
  onWithdraw: (quote: WithdrawQuote) => void;
}

const TABS: { id: VaultTab; label: string }[] = [
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
];

export function VaultPanel({ state, tab, onTabChange, onDeposit, onWithdraw }: Props) {
  const uid = useId();
  const tabRefs = useRef<Record<VaultTab, HTMLButtonElement | null>>({
    deposit: null,
    withdraw: null,
  });

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const index = TABS.findIndex((t) => t.id === tab);
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % TABS.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    const id = TABS[next]?.id;
    if (!id) return;
    onTabChange(id);
    tabRefs.current[id]?.focus();
  }

  return (
    <div className="panel">
      <div className="tabs" role="tablist" aria-label="Vault actions">
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            data-tab={t.id}
            id={`${uid}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="tabs__tab"
            onClick={() => onTabChange(t.id)}
            onKeyDown={onKeyDown}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${uid}-panel-${t.id}`}
          aria-labelledby={`${uid}-tab-${t.id}`}
          hidden={tab !== t.id}
          className="panel__body"
        >
          {tab === t.id ? (
            t.id === 'deposit' ? (
              <DepositForm state={state} onDeposit={onDeposit} />
            ) : (
              <WithdrawForm
                state={state}
                onWithdraw={onWithdraw}
                onGoToDeposit={() => {
                  onTabChange('deposit');
                  tabRefs.current.deposit?.focus();
                }}
              />
            )
          ) : null}
        </div>
      ))}
    </div>
  );
}
