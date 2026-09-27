/**
 * Bitohm vault engine.
 *
 * Mirrors the Bitcoin Cooler loop from the linked contract job:
 *   any token → zap to WBTC → deposit into f(x) (fxMint) → borrow 50% LTV fxUSD
 *   → swap fxUSD to OHM → wrap to gOHM → post gOHM to Olympus Cooler → borrow USDS
 *   → buy more WBTC → top up f(x) so the position lands at 33% LTV → mint a receipt.
 *
 * The contract is not deployed yet, so this module runs the same arithmetic locally
 * against fixed reference prices. Every function is pure so a live adapter can replace
 * `applyDeposit` / `applyWithdraw` without touching the UI.
 */

export type TokenSymbol = 'WBTC' | 'ETH' | 'USDC' | 'OHM';

export interface Token {
  symbol: TokenSymbol;
  name: string;
  /** Reference price used by the preview, in USD. */
  priceUsd: number;
  /** Display precision. */
  decimals: number;
}

export const TOKENS: Record<TokenSymbol, Token> = {
  WBTC: { symbol: 'WBTC', name: 'Wrapped Bitcoin', priceUsd: 100_000, decimals: 5 },
  ETH: { symbol: 'ETH', name: 'Ether', priceUsd: 3_500, decimals: 4 },
  USDC: { symbol: 'USDC', name: 'USD Coin', priceUsd: 1, decimals: 2 },
  OHM: { symbol: 'OHM', name: 'Olympus', priceUsd: 22, decimals: 3 },
};

export const TOKEN_LIST: Token[] = [TOKENS.WBTC, TOKENS.ETH, TOKENS.USDC, TOKENS.OHM];

export const PARAMS = {
  /** f(x) borrow at first leg. */
  fxLtv: 0.5,
  /** USDS borrowed from Cooler per dollar of gOHM posted. */
  coolerLtv: 0.625,
  /** Target f(x) LTV after the loop. */
  targetLtv: 0.33,
  /** Per-hop swap cost (fee + slippage) assumed by the preview. */
  swapFee: 0.003,
  /** OHM per gOHM (index). */
  gOhmIndex: 300,
  /** Smallest deposit the preview accepts, in USD. */
  minDepositUsd: 10,
} as const;

export interface Position {
  id: number;
  /** WBTC held as f(x) collateral. */
  collateralWbtc: number;
  /** fxUSD owed to f(x). */
  debtFxUsd: number;
  /** gOHM posted to Cooler. */
  gOhm: number;
  /** USDS owed to Cooler. */
  coolerDebtUsds: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  kind: 'deposit' | 'withdraw' | 'unwind';
  receiptId: number;
  token: TokenSymbol;
  amount: number;
  wbtc: number;
  at: string;
}

export type Balances = Record<TokenSymbol, number>;

export interface VaultState {
  version: 1;
  balances: Balances;
  positions: Position[];
  activity: Activity[];
  nextReceiptId: number;
}

export const DEFAULT_BALANCES: Balances = {
  WBTC: 1.25,
  ETH: 12,
  USDC: 25_000,
  OHM: 400,
};

export function initialState(): VaultState {
  return {
    version: 1,
    balances: { ...DEFAULT_BALANCES },
    positions: [],
    activity: [],
    nextReceiptId: 1,
  };
}

// ---------------------------------------------------------------------------
// Quotes

export interface DepositQuote {
  token: TokenSymbol;
  amount: number;
  /** WBTC after the zap. */
  wbtcIn: number;
  /** WBTC deposited to f(x) in the first leg. */
  wbtcFirstLeg: number;
  fxUsdBorrowed: number;
  ohmBought: number;
  gOhm: number;
  coolerUsds: number;
  wbtcRebought: number;
  /** WBTC held back from the zap and added at the end to reach the target LTV. */
  wbtcTopUp: number;
  /** Total collateral added to the position. */
  collateralAdded: number;
  /** Position totals after this deposit. */
  collateralAfter: number;
  debtAfter: number;
  ltvAfter: number;
  receiptId: number;
  isNewReceipt: boolean;
}

export type QuoteError =
  | { code: 'empty' }
  | { code: 'invalid' }
  | { code: 'zero' }
  | { code: 'below-minimum'; minimum: number; token: TokenSymbol }
  | { code: 'insufficient-balance'; balance: number; token: TokenSymbol }
  | { code: 'no-position' }
  | { code: 'exceeds-equity'; equity: number };

export type QuoteResult<T> = { ok: true; quote: T } | { ok: false; error: QuoteError };

export function zapToWbtc(token: TokenSymbol, amount: number): number {
  if (token === 'WBTC') return amount;
  const usd = amount * TOKENS[token].priceUsd;
  return (usd * (1 - PARAMS.swapFee)) / TOKENS.WBTC.priceUsd;
}

export function wbtcToToken(token: TokenSymbol, wbtc: number): number {
  if (token === 'WBTC') return wbtc;
  const usd = wbtc * TOKENS.WBTC.priceUsd * (1 - PARAMS.swapFee);
  return usd / TOKENS[token].priceUsd;
}

/** Fraction of zapped WBTC that goes through the first f(x) leg so the loop lands at target LTV. */
export function firstLegFraction(): number {
  const { fxLtv, coolerLtv, targetLtv, swapFee } = PARAMS;
  const hop = 1 - swapFee;
  // WBTC rebought per WBTC in the first leg.
  const rebuyRatio = fxLtv * hop * coolerLtv * hop;
  return targetLtv / (fxLtv - targetLtv * rebuyRatio);
}

export function positionLtv(p: { collateralWbtc: number; debtFxUsd: number }): number {
  if (p.collateralWbtc <= 0) return 0;
  return p.debtFxUsd / (p.collateralWbtc * TOKENS.WBTC.priceUsd);
}

export function gOhmPriceUsd(): number {
  return TOKENS.OHM.priceUsd * PARAMS.gOhmIndex;
}

/** Net equity of a position in WBTC terms, before unwind costs.
 *  Front: WBTC collateral minus fxUSD debt. Back: gOHM in Cooler minus USDS debt. */
export function positionEquityWbtc(p: Position): number {
  const front = p.collateralWbtc - p.debtFxUsd / TOKENS.WBTC.priceUsd;
  const back = (p.gOhm * gOhmPriceUsd() - p.coolerDebtUsds) / TOKENS.WBTC.priceUsd;
  return Math.max(0, front + back);
}

/** Estimated cost of unwinding the debt legs, in WBTC. */
export function unwindCostWbtc(p: Position, fraction = 1): number {
  const debtWbtc = (p.debtFxUsd / TOKENS.WBTC.priceUsd) * fraction;
  // Three swap hops to reverse: WBTC→USDS, OHM→fxUSD, and the Cooler repayment path.
  return debtWbtc * PARAMS.swapFee * 3;
}

export function quoteDeposit(
  state: VaultState,
  token: TokenSymbol,
  amount: number | null,
  receiptId: number | 'new',
): QuoteResult<DepositQuote> {
  if (amount === null) return { ok: false, error: { code: 'invalid' } };
  if (amount <= 0) return { ok: false, error: { code: 'zero' } };
  const usd = amount * TOKENS[token].priceUsd;
  if (usd < PARAMS.minDepositUsd) {
    return {
      ok: false,
      error: {
        code: 'below-minimum',
        minimum: PARAMS.minDepositUsd / TOKENS[token].priceUsd,
        token,
      },
    };
  }
  const balance = state.balances[token];
  if (amount > balance + 1e-12) {
    return { ok: false, error: { code: 'insufficient-balance', balance, token } };
  }

  const wbtcIn = zapToWbtc(token, amount);
  const hop = 1 - PARAMS.swapFee;
  const wbtcFirstLeg = Math.min(wbtcIn, wbtcIn * firstLegFraction());
  const fxUsdBorrowed = wbtcFirstLeg * TOKENS.WBTC.priceUsd * PARAMS.fxLtv;
  const ohmBought = (fxUsdBorrowed * hop) / TOKENS.OHM.priceUsd;
  const gOhm = ohmBought / PARAMS.gOhmIndex;
  const coolerUsds = ohmBought * TOKENS.OHM.priceUsd * PARAMS.coolerLtv;
  const wbtcRebought = (coolerUsds * hop) / TOKENS.WBTC.priceUsd;
  const wbtcTopUp = wbtcIn - wbtcFirstLeg;
  const collateralAdded = wbtcFirstLeg + wbtcRebought + wbtcTopUp;

  const existing =
    receiptId === 'new' ? undefined : state.positions.find((p) => p.id === receiptId);
  const collateralAfter = (existing?.collateralWbtc ?? 0) + collateralAdded;
  const debtAfter = (existing?.debtFxUsd ?? 0) + fxUsdBorrowed;

  return {
    ok: true,
    quote: {
      token,
      amount,
      wbtcIn,
      wbtcFirstLeg,
      fxUsdBorrowed,
      ohmBought,
      gOhm,
      coolerUsds,
      wbtcRebought,
      wbtcTopUp,
      collateralAdded,
      collateralAfter,
      debtAfter,
      ltvAfter: positionLtv({ collateralWbtc: collateralAfter, debtFxUsd: debtAfter }),
      receiptId: existing ? existing.id : state.nextReceiptId,
      isNewReceipt: !existing,
    },
  };
}

export interface WithdrawQuote {
  receiptId: number;
  token: TokenSymbol;
  /** WBTC of equity the user asked to withdraw. */
  amountWbtc: number;
  fraction: number;
  full: boolean;
  debtRepaid: number;
  coolerRepaid: number;
  collateralReleased: number;
  gOhmReleased: number;
  unwindCost: number;
  /** Net WBTC out before conversion. */
  wbtcOut: number;
  /** Amount received in the chosen token. */
  amountOut: number;
  collateralAfter: number;
  debtAfter: number;
  ltvAfter: number;
}

export function quoteWithdraw(
  state: VaultState,
  receiptId: number | null,
  token: TokenSymbol,
  amountWbtc: number | null,
  full: boolean,
): QuoteResult<WithdrawQuote> {
  const position = state.positions.find((p) => p.id === receiptId);
  if (!position) return { ok: false, error: { code: 'no-position' } };
  const equity = positionEquityWbtc(position);

  let fraction: number;
  let requested: number;
  if (full) {
    fraction = 1;
    requested = equity;
  } else {
    if (amountWbtc === null) return { ok: false, error: { code: 'invalid' } };
    if (amountWbtc <= 0) return { ok: false, error: { code: 'zero' } };
    if (amountWbtc > equity + 1e-12) {
      return { ok: false, error: { code: 'exceeds-equity', equity } };
    }
    requested = amountWbtc;
    fraction = equity > 0 ? Math.min(1, amountWbtc / equity) : 1;
  }
  const isFull = full || fraction >= 0.9999;
  if (isFull) fraction = 1;

  const debtRepaid = position.debtFxUsd * fraction;
  const coolerRepaid = position.coolerDebtUsds * fraction;
  const collateralReleased = position.collateralWbtc * fraction;
  const gOhmReleased = position.gOhm * fraction;
  const unwindCost = unwindCostWbtc(position, fraction);
  const backEquityWbtc = (gOhmReleased * gOhmPriceUsd() - coolerRepaid) / TOKENS.WBTC.priceUsd;
  const wbtcOut = Math.max(
    0,
    collateralReleased - debtRepaid / TOKENS.WBTC.priceUsd + backEquityWbtc - unwindCost,
  );
  const amountOut = wbtcToToken(token, wbtcOut);
  const collateralAfter = isFull ? 0 : position.collateralWbtc - collateralReleased;
  const debtAfter = isFull ? 0 : position.debtFxUsd - debtRepaid;

  return {
    ok: true,
    quote: {
      receiptId: position.id,
      token,
      amountWbtc: requested,
      fraction,
      full: isFull,
      debtRepaid,
      coolerRepaid,
      collateralReleased,
      gOhmReleased,
      unwindCost,
      wbtcOut,
      amountOut,
      collateralAfter,
      debtAfter,
      ltvAfter: positionLtv({ collateralWbtc: collateralAfter, debtFxUsd: debtAfter }),
    },
  };
}

// ---------------------------------------------------------------------------
// State transitions

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function applyDeposit(state: VaultState, quote: DepositQuote, now = new Date()): VaultState {
  const at = now.toISOString();
  const balances = { ...state.balances, [quote.token]: state.balances[quote.token] - quote.amount };
  let positions: Position[];
  let nextReceiptId = state.nextReceiptId;
  if (quote.isNewReceipt) {
    positions = [
      ...state.positions,
      {
        id: quote.receiptId,
        collateralWbtc: quote.collateralAdded,
        debtFxUsd: quote.fxUsdBorrowed,
        gOhm: quote.gOhm,
        coolerDebtUsds: quote.coolerUsds,
        createdAt: at,
        updatedAt: at,
      },
    ];
    nextReceiptId = Math.max(nextReceiptId, quote.receiptId) + 1;
  } else {
    positions = state.positions.map((p) =>
      p.id === quote.receiptId
        ? {
            ...p,
            collateralWbtc: p.collateralWbtc + quote.collateralAdded,
            debtFxUsd: p.debtFxUsd + quote.fxUsdBorrowed,
            gOhm: p.gOhm + quote.gOhm,
            coolerDebtUsds: p.coolerDebtUsds + quote.coolerUsds,
            updatedAt: at,
          }
        : p,
    );
  }
  const activity: Activity = {
    id: newId(),
    kind: 'deposit',
    receiptId: quote.receiptId,
    token: quote.token,
    amount: quote.amount,
    wbtc: quote.collateralAdded,
    at,
  };
  return {
    ...state,
    balances,
    positions,
    nextReceiptId,
    activity: [activity, ...state.activity].slice(0, 50),
  };
}

export function applyWithdraw(state: VaultState, quote: WithdrawQuote, now = new Date()): VaultState {
  const at = now.toISOString();
  const balances = {
    ...state.balances,
    [quote.token]: state.balances[quote.token] + quote.amountOut,
  };
  const positions = quote.full
    ? state.positions.filter((p) => p.id !== quote.receiptId)
    : state.positions.map((p) =>
        p.id === quote.receiptId
          ? {
              ...p,
              collateralWbtc: p.collateralWbtc - quote.collateralReleased,
              debtFxUsd: p.debtFxUsd - quote.debtRepaid,
              gOhm: p.gOhm - quote.gOhmReleased,
              coolerDebtUsds: p.coolerDebtUsds - quote.coolerRepaid,
              updatedAt: at,
            }
          : p,
      );
  const activity: Activity = {
    id: newId(),
    kind: quote.full ? 'unwind' : 'withdraw',
    receiptId: quote.receiptId,
    token: quote.token,
    amount: quote.amountOut,
    wbtc: quote.wbtcOut,
    at,
  };
  return { ...state, balances, positions, activity: [activity, ...state.activity].slice(0, 50) };
}

// ---------------------------------------------------------------------------
// Aggregates

export interface Totals {
  collateralWbtc: number;
  collateralUsd: number;
  debtFxUsd: number;
  gOhm: number;
  gOhmUsd: number;
  coolerDebtUsds: number;
  equityWbtc: number;
  ltv: number;
  receipts: number;
}

export function totals(state: VaultState): Totals {
  const collateralWbtc = state.positions.reduce((s, p) => s + p.collateralWbtc, 0);
  const debtFxUsd = state.positions.reduce((s, p) => s + p.debtFxUsd, 0);
  const gOhm = state.positions.reduce((s, p) => s + p.gOhm, 0);
  const coolerDebtUsds = state.positions.reduce((s, p) => s + p.coolerDebtUsds, 0);
  return {
    collateralWbtc,
    collateralUsd: collateralWbtc * TOKENS.WBTC.priceUsd,
    debtFxUsd,
    gOhm,
    gOhmUsd: gOhm * gOhmPriceUsd(),
    coolerDebtUsds,
    equityWbtc: state.positions.reduce((s, p) => s + positionEquityWbtc(p), 0),
    ltv: positionLtv({ collateralWbtc, debtFxUsd }),
    receipts: state.positions.length,
  };
}

// ---------------------------------------------------------------------------
// Persistence

export const STORAGE_KEY = 'bitohm.preview.v1';

function isBalances(v: unknown): v is Balances {
  if (typeof v !== 'object' || v === null) return false;
  return (['WBTC', 'ETH', 'USDC', 'OHM'] as const).every(
    (k) => typeof (v as Record<string, unknown>)[k] === 'number',
  );
}

export function loadState(storage: Pick<Storage, 'getItem'> | undefined): VaultState {
  if (!storage) return initialState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<VaultState>;
    if (
      parsed.version !== 1 ||
      !isBalances(parsed.balances) ||
      !Array.isArray(parsed.positions) ||
      !Array.isArray(parsed.activity) ||
      typeof parsed.nextReceiptId !== 'number'
    ) {
      return initialState();
    }
    return {
      version: 1,
      balances: parsed.balances,
      positions: parsed.positions,
      activity: parsed.activity,
      nextReceiptId: parsed.nextReceiptId,
    };
  } catch {
    return initialState();
  }
}

export function saveState(storage: Pick<Storage, 'setItem'> | undefined, state: VaultState): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or blocked; the preview keeps working in memory.
  }
}
