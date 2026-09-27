import { formatAmount, formatTime } from '../lib/format';
import { TOKENS, type Activity } from '../lib/vault';

interface Props {
  activity: Activity[];
}

function describe(a: Activity): string {
  const amount = `${formatAmount(a.amount, TOKENS[a.token].decimals)} ${a.token}`;
  switch (a.kind) {
    case 'deposit':
      return `Deposited ${amount} into receipt #${a.receiptId} (${formatAmount(a.wbtc, 5)} WBTC collateral added)`;
    case 'withdraw':
      return `Withdrew ${amount} from receipt #${a.receiptId}`;
    case 'unwind':
      return `Unwound receipt #${a.receiptId} for ${amount}`;
  }
}

export function ActivityLog({ activity }: Props) {
  return (
    <section className="section" id="activity" aria-labelledby="activity-title">
      <div className="section__head">
        <h2 id="activity-title">Activity</h2>
      </div>
      {activity.length === 0 ? (
        <p className="section__lede">Deposits and withdrawals from this browser appear here.</p>
      ) : (
        <ol className="activity">
          {activity.map((a) => (
            <li key={a.id} className={`activity__item activity__item--${a.kind}`}>
              <span className="activity__dot" aria-hidden="true" />
              <span className="activity__text">{describe(a)}</span>
              <time className="activity__time" dateTime={a.at}>
                {formatTime(a.at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
