import type { ReactNode } from 'react';

export interface QuoteRow {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}

interface Props {
  title: string;
  rows: QuoteRow[];
}

export function QuoteList({ title, rows }: Props) {
  return (
    <div className="quote">
      <p className="quote__title">{title}</p>
      <dl className="quote__list">
        {rows.map((row) => (
          <div key={row.label} className={`quote__row${row.emphasis ? ' quote__row--total' : ''}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
