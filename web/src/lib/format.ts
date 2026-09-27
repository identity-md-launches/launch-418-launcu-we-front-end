const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatUsd(value: number, precise = false): string {
  if (!Number.isFinite(value)) return '—';
  return (precise ? usdPrecise : usd).format(value);
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return pct.format(value);
}

/** Token amount with sensible precision per asset size. */
export function formatAmount(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  // Large values need fewer decimals, sub-unit values one more so small WBTC amounts keep
  // meaningful digits (0.02999 rather than 0.03).
  const digits = abs >= 1000 ? 2 : abs >= 1 ? decimals : Math.min(decimals + 1, 8);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Parse a user-typed decimal amount. Returns null when not a positive finite number. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '');
  if (cleaned === '' || !/^\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return value;
}
