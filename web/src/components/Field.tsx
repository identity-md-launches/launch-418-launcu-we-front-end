import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  trailing?: ReactNode;
}

/** Label + control + hint/error, with the ids wired for aria-describedby. */
export function Field({ id, label, hint, error, children, trailing }: Props) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <div className="field__head">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {trailing ? <div className="field__trailing">{trailing}</div> : null}
      </div>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error: string | null | undefined, hasHint: boolean) {
  if (error) return `${id}-error`;
  if (hasHint) return `${id}-hint`;
  return undefined;
}
