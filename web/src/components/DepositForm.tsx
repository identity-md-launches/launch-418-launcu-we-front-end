import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { formatAmount, formatPct, formatUsd, parseAmount } from '../lib/format';
import {
  TOKENS,
  quoteDeposit,
  type DepositQuote,
  type QuoteError,
  type TokenSymbol,
  type VaultState,
} from '../lib/vault';
import { Field, describedBy } from './Field';
import { QuoteList } from './QuoteList';
import { TokenSelect } from './TokenSelect';

interface Props {
  state: VaultState;
  onDeposit: (quote: DepositQuote) => void;
}

function errorText(error: QuoteError): string {
  switch (error.code) {
    case 'empty':
    case 'invalid':
      return 'Enter an amount using digits, for example 0.25.';
    case 'zero':
      return 'Enter an amount greater than zero.';
    case 'below-minimum':
      return `Deposit at least ${formatAmount(error.minimum, TOKENS[error.token].decimals)} ${error.token} (about ${formatUsd(10)}).`;
    case 'insufficient-balance':
      return `Enter up to ${formatAmount(error.balance, TOKENS[error.token].decimals)} ${error.token}, the balance available.`;
    default:
      return 'Check the amount and try again.';
  }
}

export function DepositForm({ state, onDeposit }: Props) {
  const uid = useId();
  const tokenId = `${uid}-token`;
  const amountId = `${uid}-amount`;
  const receiptId = `${uid}-receipt`;
  const amountRef = useRef<HTMLInputElement>(null);

  const [token, setToken] = useState<TokenSymbol>('WBTC');
  const [raw, setRaw] = useState('');
  const [target, setTarget] = useState<number | 'new'>('new');
  const [submitted, setSubmitted] = useState(false);

  const balance = state.balances[token];
  const amount = parseAmount(raw);
  const touched = raw.trim() !== '';
  const existingTarget = target === 'new' || state.positions.some((p) => p.id === target) ? target : 'new';

  const result = useMemo(
    () => quoteDeposit(state, token, amount, existingTarget),
    [state, token, amount, existingTarget],
  );

  const showError = (submitted || touched) && !result.ok;
  const error = showError && !result.ok ? errorText(result.error) : null;
  const hint = `Balance ${formatAmount(balance, TOKENS[token].decimals)} ${token} · reference price ${formatUsd(TOKENS[token].priceUsd, TOKENS[token].priceUsd < 10)}`;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!result.ok) {
      amountRef.current?.focus();
      return;
    }
    onDeposit(result.quote);
    setRaw('');
    setSubmitted(false);
    if (result.quote.isNewReceipt) setTarget(result.quote.receiptId);
  }

  function setMax() {
    setRaw(String(balance));
    amountRef.current?.focus();
  }

  return (
    <form className="vault-form" onSubmit={handleSubmit} noValidate>
      <Field id={tokenId} label="Deposit token">
        <TokenSelect id={tokenId} value={token} onChange={setToken} />
      </Field>

      <Field
        id={amountId}
        label="Amount"
        hint={hint}
        error={error}
        trailing={
          <button type="button" className="button button--inline" onClick={setMax}>
            Use max
          </button>
        }
      >
        <div className="amount-input">
          <input
            ref={amountRef}
            id={amountId}
            className="amount-input__control"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="0.00"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(amountId, error, true)}
          />
          <span className="amount-input__unit" aria-hidden="true">
            {token}
          </span>
        </div>
      </Field>

      {state.positions.length > 0 ? (
        <Field id={receiptId} label="Add to receipt">
          <select
            id={receiptId}
            className="select"
            value={existingTarget}
            onChange={(e) => setTarget(e.target.value === 'new' ? 'new' : Number(e.target.value))}
          >
            <option value="new">Mint a new receipt</option>
            {state.positions.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {formatAmount(p.collateralWbtc, 3)} WBTC
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {result.ok ? (
        <QuoteList
          title="What the loop will do"
          rows={[
            {
              label: 'Zapped to WBTC',
              value: `${formatAmount(result.quote.wbtcIn, 5)} WBTC`,
            },
            {
              label: 'Borrowed on f(x) at 50%',
              value: `${formatUsd(result.quote.fxUsdBorrowed)} fxUSD`,
            },
            {
              label: 'Wrapped into Cooler',
              value: `${formatAmount(result.quote.gOhm, 4)} gOHM`,
            },
            {
              label: 'Cooler borrows',
              value: `${formatUsd(result.quote.coolerUsds)} USDS`,
            },
            {
              label: 'Bitcoin bought back',
              value: `${formatAmount(result.quote.wbtcRebought, 5)} WBTC`,
            },
            {
              label: 'Held for the 33% top-up',
              value: `${formatAmount(result.quote.wbtcTopUp, 5)} WBTC`,
            },
            {
              label: 'Position after',
              value: `${formatAmount(result.quote.collateralAfter, 5)} WBTC at ${formatPct(result.quote.ltvAfter)} LTV`,
              emphasis: true,
            },
            {
              label: 'Receipt',
              value: result.quote.isNewReceipt
                ? `Mint #${result.quote.receiptId}`
                : `Update #${result.quote.receiptId}`,
            },
          ]}
        />
      ) : (
        <p className="vault-form__placeholder">
          Enter an amount to preview the loop: zap, f(x) borrow, Cooler, buy-back and top-up.
        </p>
      )}

      <button type="submit" className="button button--primary button--block">
        Deposit {token}
      </button>
    </form>
  );
}
