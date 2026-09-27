import { formatAmount, formatPct, formatTime, formatUsd } from '../lib/format';
import { positionEquityWbtc, positionLtv, type Position } from '../lib/vault';

interface Props {
  positions: Position[];
  onDeposit: () => void;
  onWithdraw: () => void;
}

export function Positions({ positions, onDeposit, onWithdraw }: Props) {
  return (
    <section className="section" id="positions" aria-labelledby="positions-title">
      <div className="section__head">
        <h2 id="positions-title">Receipts</h2>
        <p className="section__lede">
          Each receipt is one looped position: Bitcoin collateral on f(x) in the front, gOHM in
          Cooler in the back. Deposit again to grow it or unwind it at any time.
        </p>
      </div>

      {positions.length === 0 ? (
        <div className="empty card">
          <p className="empty__title">No receipts yet</p>
          <p className="empty__body">
            Your first deposit runs the loop and mints receipt #1. It shows up here with its
            collateral, debt and loan-to-value.
          </p>
          <button type="button" className="button button--primary" onClick={onDeposit}>
            Make a deposit
          </button>
        </div>
      ) : (
        <ul className="receipt-list">
          {positions.map((p) => {
            const ltv = positionLtv(p);
            return (
              <li key={p.id} className="receipt card">
                <div className="receipt__head">
                  <h3 className="receipt__title">Receipt #{p.id}</h3>
                  <span className="badge">{formatPct(ltv)} LTV</span>
                </div>
                <dl className="receipt__grid">
                  <div>
                    <dt>f(x) collateral</dt>
                    <dd>{formatAmount(p.collateralWbtc, 5)} WBTC</dd>
                  </div>
                  <div>
                    <dt>fxUSD debt</dt>
                    <dd>{formatUsd(p.debtFxUsd)}</dd>
                  </div>
                  <div>
                    <dt>gOHM in Cooler</dt>
                    <dd>{formatAmount(p.gOhm, 4)} gOHM</dd>
                  </div>
                  <div>
                    <dt>Cooler debt</dt>
                    <dd>{formatUsd(p.coolerDebtUsds)} USDS</dd>
                  </div>
                  <div>
                    <dt>Net equity</dt>
                    <dd>{formatAmount(positionEquityWbtc(p), 5)} WBTC</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>
                      <time dateTime={p.updatedAt}>{formatTime(p.updatedAt)}</time>
                    </dd>
                  </div>
                </dl>
                <div className="receipt__actions">
                  <button type="button" className="button button--ghost" onClick={onDeposit}>
                    Deposit more
                  </button>
                  <button type="button" className="button button--ghost" onClick={onWithdraw}>
                    Withdraw
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
