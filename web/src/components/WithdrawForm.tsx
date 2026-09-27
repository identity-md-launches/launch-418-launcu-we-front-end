import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { formatAmount, formatPct, formatUsd, parseAmount } from '../lib/format';
import {
  TOKENS,
  positionEquityWbtc,
  positionLtv,
  quoteWithdraw,
  type QuoteError,
  type TokenSymbol,
  type VaultState,
  type WithdrawQuote,
} from '../lib/vault';
import { Field, describedBy } from './Field';
import { QuoteList } from './QuoteList';
import { TokenSelect } from './TokenSelect';

interface Props {
  state: VaultState;
  onWithdraw: (quote: WithdrawQuote) => void;
  onGoToDeposit: () => void;
}

function errorText(error: QuoteError): string {
  switch (error.code) {
    case 'empty':
    case 'invalid':
      return 'Enter an amount using digits, for example 0.1.';
    case 'zero':
      return 'Enter an amount greater than zero.';
    case 'exceeds-equity':
      return `Enter up to ${formatAmount(error.equity, 5)} WBTC, the equity in this receipt, or choose “Unwind the whole receipt”.`;
    case 'no-position':
      return 'Choose a receipt to withdraw from.';
    default:
      return 'Check the amount and try again.';
  }
}

export function WithdrawForm({ state, onWithdraw, onGoToDeposit }: Props) {
  const uid = useId();
  const receiptId = `${uid}-receipt`;
  const amountId = `${uid}-amount`;
  const fullId = `${uid}-full`;
  const tokenId = `${uid}-token`;
  const amountRef = useRef<HTMLInputElement>(null);

  const first = state.positions[0];
  const [selected, setSelected] = useState<number | null>(first ? first.id : null);
  const [raw, setRaw] = useState('');
  const [full, setFull] = useState(false);
  const [token, setToken] = useState<TokenSymbol>('WBTC');
  const [submitted, setSubmitted] = useState(false);

  // Keep the selection valid when receipts are minted or burned.
  useEffect(() => {
    if (selected !== null && state.positions.some((p) => p.id === selected)) return;
    setSelected(first ? first.id : null);
  }, [state.positions, selected, first]);

  const position = state.positions.find((p) => p.id === selected);
  const equity = position ? positionEquityWbtc(position) : 0;
  const amount = parseAmount(raw);
  const touched = raw.trim() !== '' || full;

  const result = useMemo(
    () => quoteWithdraw(state, selected, token, amount, full),
    [state, selected, token, amount, full],
  );

  if (!position) {
    return (
      <div className="empty">
        <p className="empty__title">No receipts yet</p>
        <p className="empty__body">
          A receipt is minted with your first deposit. Withdrawals unwind part or all of it.
        </p>
        <button type="button" className="button button--primary" onClick={onGoToDeposit}>
          Make a deposit
        </button>
      </div>
    );
  }

  const showError = (submitted || touched) && !result.ok;
  const error = showError && !result.ok ? errorText(result.error) : null;
  const hint = `Equity ${formatAmount(equity, 5)} WBTC in receipt #${position.id}`;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!result.ok) {
      amountRef.current?.focus();
      return;
    }
    onWithdraw(result.quote);
    setRaw('');
    setFull(false);
    setSubmitted(false);
  }

  return (
    <form className="vault-form" onSubmit={handleSubmit} noValidate>
      <Field id={receiptId} label="Receipt">
        <select
          id={receiptId}
          className="select"
          value={position.id}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {state.positions.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} · {formatAmount(p.collateralWbtc, 3)} WBTC · {formatPct(positionLtv(p))} LTV
            </option>
          ))}
        </select>
      </Field>

      <Field
        id={amountId}
        label="Withdraw"
        hint={hint}
        error={error}
        trailing={
          <button
            type="button"
            className="button button--inline"
            onClick={() => {
              setFull(false);
              setRaw(String(Number(equity.toFixed(8))));
              amountRef.current?.focus();
            }}
          >
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
            value={full ? formatAmount(equity, 8) : raw}
            disabled={full}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(amountId, error, true)}
          />
          <span className="amount-input__unit" aria-hidden="true">
            WBTC
          </span>
        </div>
      </Field>

      <div className="checkbox">
        <input
          id={fullId}
          type="checkbox"
          checked={full}
          onChange={(e) => setFull(e.target.checked)}
        />
        <label htmlFor={fullId}>Unwind the whole receipt and burn it</label>
      </div>

      <Field id={tokenId} label="Receive as">
        <TokenSelect id={tokenId} value={token} onChange={setToken} />
      </Field>

      {result.ok ? (
        <QuoteList
          title="What unwinding will do"
          rows={[
            {
              label: 'Cooler repaid',
              value: `${formatUsd(result.quote.coolerRepaid)} USDS`,
            },
            {
              label: 'gOHM unwrapped and sold',
              value: `${formatAmount(result.quote.gOhmReleased, 4)} gOHM`,
            },
            {
              label: 'f(x) repaid',
              value: `${formatUsd(result.quote.debtRepaid)} fxUSD`,
            },
            {
              label: 'Collateral released',
              value: `${formatAmount(result.quote.collateralReleased, 5)} WBTC`,
            },
            {
              label: 'Estimated unwind cost',
              value: `${formatAmount(result.quote.unwindCost, 6)} WBTC`,
            },
            {
              label: 'You receive',
              value: `${formatAmount(result.quote.amountOut, TOKENS[token].decimals)} ${token}`,
              emphasis: true,
            },
            {
              label: 'Receipt after',
              value: result.quote.full
                ? `#${result.quote.receiptId} burned`
                : `${formatAmount(result.quote.collateralAfter, 5)} WBTC at ${formatPct(result.quote.ltvAfter)} LTV`,
            },
          ]}
        />
      ) : (
        <p className="vault-form__placeholder">
          Enter an amount of equity to preview the unwind, or unwind the whole receipt.
        </p>
      )}

      <button type="submit" className="button button--primary button--block">
        {result.ok && result.quote.full ? `Unwind receipt #${position.id}` : `Withdraw ${token}`}
      </button>
    </form>
  );
}
