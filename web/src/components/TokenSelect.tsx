import { TOKEN_LIST, type TokenSymbol } from '../lib/vault';

interface Props {
  id: string;
  value: TokenSymbol;
  onChange: (token: TokenSymbol) => void;
  describedBy?: string;
}

export function TokenSelect({ id, value, onChange, describedBy }: Props) {
  return (
    <div className="token-select">
      <span className={`token-mark token-mark--${value.toLowerCase()}`} aria-hidden="true">
        {value === 'WBTC' ? '₿' : value === 'OHM' ? 'Ω' : value === 'ETH' ? 'Ξ' : '$'}
      </span>
      <select
        id={id}
        className="token-select__control"
        value={value}
        onChange={(e) => onChange(e.target.value as TokenSymbol)}
        aria-describedby={describedBy}
      >
        {TOKEN_LIST.map((t) => (
          <option key={t.symbol} value={t.symbol}>
            {t.symbol} · {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
