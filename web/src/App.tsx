import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityLog } from './components/ActivityLog';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Positions } from './components/Positions';
import { Stats } from './components/Stats';
import { VaultPanel, type VaultTab } from './components/VaultPanel';
import { formatAmount } from './lib/format';
import { useVault } from './lib/useVault';
import { TOKENS, type DepositQuote, type WithdrawQuote } from './lib/vault';

export default function App() {
  const { state, summary, deposit, withdraw, reset } = useVault();
  const [tab, setTab] = useState<VaultTab>('deposit');
  const [status, setStatus] = useState('');
  const vaultRef = useRef<HTMLElement>(null);
  const clearTimer = useRef<number | undefined>(undefined);

  const announce = useCallback((message: string) => {
    setStatus(message);
    window.clearTimeout(clearTimer.current);
    clearTimer.current = window.setTimeout(() => setStatus(''), 8000);
  }, []);

  useEffect(() => () => window.clearTimeout(clearTimer.current), []);

  const goTo = useCallback((next: VaultTab) => {
    setTab(next);
    vaultRef.current?.scrollIntoView({ block: 'start' });
    // Focus the target tab by name: the selected state has not re-rendered yet.
    const target = vaultRef.current?.querySelector<HTMLElement>(`[role="tab"][data-tab="${next}"]`);
    target?.focus();
  }, []);

  function handleDeposit(quote: DepositQuote) {
    deposit(quote);
    announce(
      quote.isNewReceipt
        ? `Deposited ${formatAmount(quote.amount, TOKENS[quote.token].decimals)} ${quote.token}. Receipt #${quote.receiptId} minted.`
        : `Deposited ${formatAmount(quote.amount, TOKENS[quote.token].decimals)} ${quote.token} into receipt #${quote.receiptId}.`,
    );
  }

  function handleWithdraw(quote: WithdrawQuote) {
    withdraw(quote);
    announce(
      quote.full
        ? `Receipt #${quote.receiptId} unwound. ${formatAmount(quote.amountOut, TOKENS[quote.token].decimals)} ${quote.token} returned.`
        : `Withdrew ${formatAmount(quote.amountOut, TOKENS[quote.token].decimals)} ${quote.token} from receipt #${quote.receiptId}.`,
    );
  }

  function handleReset() {
    if (
      state.positions.length > 0 &&
      !window.confirm('Reset the preview? All receipts and balances in this browser go back to their starting values.')
    ) {
      return;
    }
    reset();
    announce('Preview reset. Balances are back to their starting values.');
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <span id="top" />
      <Header />
      <main id="main" className="page">
        <Hero />

        <section className="section section--vault" id="vault" aria-labelledby="vault-title" ref={vaultRef}>
          <div className="section__head">
            <h2 id="vault-title">Vault</h2>
            <p className="section__lede">
              Deposit to run the loop and mint a receipt. Withdraw to unwind part or all of one.
            </p>
          </div>
          <div className="notice" role="note">
            <strong>Preview mode.</strong> The Bitcoin Cooler contract is not deployed yet, so
            deposits and withdrawals here run the loop locally at reference prices (WBTC $100,000,
            ETH $3,500, OHM $22) and stay in this browser. Nothing is sent on-chain.
          </div>
          <div className="vault-layout">
            <VaultPanel
              state={state}
              tab={tab}
              onTabChange={setTab}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />
            <Stats summary={summary} />
          </div>
        </section>

        <Positions
          positions={state.positions}
          onDeposit={() => goTo('deposit')}
          onWithdraw={() => goTo('withdraw')}
        />
        <ActivityLog activity={state.activity} />
        <HowItWorks />
      </main>
      <Footer onReset={handleReset} />
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
        {status ? <div className="toast">{status}</div> : null}
      </div>
    </>
  );
}
