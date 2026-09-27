import { formatAmount, formatPct, formatUsd } from '../lib/format';
import type { Totals } from '../lib/vault';

interface Props {
  summary: Totals;
}

export function Stats({ summary }: Props) {
  const hasPosition = summary.receipts > 0;
  return (
    <section className="stats" aria-labelledby="stats-title">
      <h2 id="stats-title" className="visually-hidden">
        Your position
      </h2>
      <dl className="stat-grid">
        <div className="stat">
          <dt>Bitcoin in the front</dt>
          <dd className="stat__value">
            {formatAmount(summary.collateralWbtc, 5)} <span className="stat__unit">WBTC</span>
          </dd>
          <dd className="stat__sub">{formatUsd(summary.collateralUsd)} f(x) collateral</dd>
        </div>
        <div className="stat">
          <dt>OHM in the back</dt>
          <dd className="stat__value">
            {formatAmount(summary.gOhm, 4)} <span className="stat__unit">gOHM</span>
          </dd>
          <dd className="stat__sub">{formatUsd(summary.gOhmUsd)} in Cooler</dd>
        </div>
        <div className="stat">
          <dt>Loan-to-value</dt>
          <dd className="stat__value">{hasPosition ? formatPct(summary.ltv) : '—'}</dd>
          <dd className="stat__sub">{formatUsd(summary.debtFxUsd)} fxUSD owed · target 33%</dd>
        </div>
        <div className="stat">
          <dt>Receipts</dt>
          <dd className="stat__value">{summary.receipts}</dd>
          <dd className="stat__sub">
            {formatAmount(summary.equityWbtc, 5)} WBTC net equity
          </dd>
        </div>
      </dl>
    </section>
  );
}
