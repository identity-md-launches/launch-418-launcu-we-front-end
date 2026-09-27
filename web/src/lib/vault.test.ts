import { describe, expect, it } from 'vitest';
import {
  PARAMS,
  TOKENS,
  applyDeposit,
  applyWithdraw,
  firstLegFraction,
  initialState,
  loadState,
  positionEquityWbtc,
  positionLtv,
  quoteDeposit,
  quoteWithdraw,
  saveState,
  totals,
} from './vault';

describe('deposit quote', () => {
  it('lands a fresh WBTC deposit at the 33% target LTV', () => {
    const res = quoteDeposit(initialState(), 'WBTC', 1, 'new');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const q = res.quote;
    expect(q.ltvAfter).toBeCloseTo(PARAMS.targetLtv, 6);
    expect(q.wbtcFirstLeg + q.wbtcTopUp).toBeCloseTo(1, 12);
    expect(q.fxUsdBorrowed).toBeCloseTo(q.wbtcFirstLeg * TOKENS.WBTC.priceUsd * PARAMS.fxLtv, 9);
    expect(q.collateralAdded).toBeGreaterThan(1);
    expect(q.receiptId).toBe(1);
    expect(q.isNewReceipt).toBe(true);
  });

  it('zaps non-WBTC tokens at the reference price minus one hop', () => {
    const res = quoteDeposit(initialState(), 'USDC', 10_000, 'new');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.quote.wbtcIn).toBeCloseTo((10_000 * (1 - PARAMS.swapFee)) / 100_000, 12);
  });

  it('rejects empty, zero, dust and over-balance amounts', () => {
    const s = initialState();
    expect(quoteDeposit(s, 'WBTC', null, 'new')).toEqual({ ok: false, error: { code: 'invalid' } });
    expect(quoteDeposit(s, 'WBTC', 0, 'new')).toEqual({ ok: false, error: { code: 'zero' } });
    const dust = quoteDeposit(s, 'USDC', 5, 'new');
    expect(dust.ok).toBe(false);
    if (!dust.ok) expect(dust.error.code).toBe('below-minimum');
    const big = quoteDeposit(s, 'WBTC', 5, 'new');
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.error.code).toBe('insufficient-balance');
  });

  it('first-leg fraction is between 0 and 1', () => {
    const f = firstLegFraction();
    expect(f).toBeGreaterThan(0.5);
    expect(f).toBeLessThan(1);
  });
});

describe('deposit and repeat deposit', () => {
  it('mints a receipt, debits the wallet and keeps LTV on target after a second deposit', () => {
    let s = initialState();
    const q1 = quoteDeposit(s, 'WBTC', 0.5, 'new');
    if (!q1.ok) throw new Error('quote failed');
    s = applyDeposit(s, q1.quote, new Date('2026-01-01T00:00:00Z'));
    expect(s.positions).toHaveLength(1);
    expect(s.balances.WBTC).toBeCloseTo(0.75, 12);
    expect(s.nextReceiptId).toBe(2);
    expect(s.activity[0]?.kind).toBe('deposit');

    const q2 = quoteDeposit(s, 'ETH', 2, 1);
    if (!q2.ok) throw new Error('quote failed');
    expect(q2.quote.isNewReceipt).toBe(false);
    expect(q2.quote.ltvAfter).toBeCloseTo(PARAMS.targetLtv, 6);
    s = applyDeposit(s, q2.quote);
    expect(s.positions).toHaveLength(1);
    expect(positionLtv(s.positions[0]!)).toBeCloseTo(PARAMS.targetLtv, 6);
    expect(s.balances.ETH).toBe(10);
    expect(totals(s).receipts).toBe(1);
  });
});

describe('withdraw', () => {
  function seeded() {
    let s = initialState();
    const q = quoteDeposit(s, 'WBTC', 1, 'new');
    if (!q.ok) throw new Error('quote failed');
    s = applyDeposit(s, q.quote);
    return s;
  }

  it('partial withdraw returns proportional equity minus unwind cost and keeps LTV', () => {
    const s = seeded();
    const p = s.positions[0]!;
    const equity = positionEquityWbtc(p);
    // The loop only loses swap hops: equity stays within 1% of the deposit.
    expect(equity).toBeGreaterThan(0.99);
    expect(equity).toBeLessThan(1);
    const res = quoteWithdraw(s, 1, 'WBTC', equity / 2, false);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.quote.full).toBe(false);
    expect(res.quote.fraction).toBeCloseTo(0.5, 9);
    expect(res.quote.wbtcOut).toBeLessThan(equity / 2);
    expect(res.quote.wbtcOut).toBeGreaterThan(equity / 2 - 0.01);
    expect(res.quote.ltvAfter).toBeCloseTo(PARAMS.targetLtv, 6);
    const next = applyWithdraw(s, res.quote);
    expect(next.positions).toHaveLength(1);
    expect(next.balances.WBTC).toBeCloseTo(0.25 + res.quote.wbtcOut, 12);
  });

  it('full unwind burns the receipt and credits the chosen token', () => {
    const s = seeded();
    const res = quoteWithdraw(s, 1, 'USDC', null, true);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.quote.full).toBe(true);
    expect(res.quote.amountOut).toBeGreaterThan(98_000);
    expect(res.quote.amountOut).toBeLessThan(100_000);
    const next = applyWithdraw(s, res.quote);
    expect(next.positions).toHaveLength(0);
    expect(next.balances.USDC).toBeCloseTo(25_000 + res.quote.amountOut, 9);
    expect(next.activity[0]?.kind).toBe('unwind');
  });

  it('rejects unknown receipts and over-equity amounts', () => {
    const s = seeded();
    expect(quoteWithdraw(s, 99, 'WBTC', 0.1, false)).toEqual({
      ok: false,
      error: { code: 'no-position' },
    });
    const over = quoteWithdraw(s, 1, 'WBTC', 5, false);
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.error.code).toBe('exceeds-equity');
  });
});

describe('persistence', () => {
  it('round-trips through storage and falls back on garbage', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    let s = initialState();
    const q = quoteDeposit(s, 'OHM', 100, 'new');
    if (!q.ok) throw new Error('quote failed');
    s = applyDeposit(s, q.quote);
    saveState(storage, s);
    expect(loadState(storage)).toEqual(s);
    storage.setItem('bitohm.preview.v1', '{"version":2}');
    expect(loadState(storage)).toEqual(initialState());
    storage.setItem('bitohm.preview.v1', 'not json');
    expect(loadState(storage)).toEqual(initialState());
    expect(loadState(undefined)).toEqual(initialState());
  });
});
