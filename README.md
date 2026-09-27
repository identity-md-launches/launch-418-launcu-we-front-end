# Bitohm

**Bitcoin in the front, OHM in the back. An infinite flywheel.**

Bitohm is the vault front end for the Bitcoin Cooler (`$BCLR`) loop built on the IdentityMD
network ([contract job](https://explorer.imd.fun/jobs/9df471c0-b9f9-474e-b2e1-1aa86c7f7412)).
The loop zaps any deposit into WBTC, mints on f(x) at 50% LTV, swaps the fxUSD to OHM, wraps it to
gOHM, posts it to Olympus Cooler, buys more WBTC with the USDS and settles the f(x) position at 33%
LTV. Every deposit runs the loop again on the same receipt; withdrawals unwind part or all of it.

The site is a single static page (Vite + React + TypeScript, plain CSS tokens) in the OlympusDAO
charcoal-and-gold register. Design tokens and components are documented in [DESIGN.md](DESIGN.md);
the review and validation record is in [artifacts/validation.md](artifacts/validation.md).

## Preview mode (important)

The Bitcoin Cooler contract has **not been deployed** (the linked job records "No deployment
performed"), and no contract address or chain was supplied with this assignment. The vault page
therefore runs the loop's arithmetic **locally** with fixed reference prices (WBTC $100,000,
ETH $3,500, OHM $22, gOHM index 300) and keeps balances, receipts and activity in the browser's
`localStorage` under the key `bitohm.preview.v1`. Nothing is sent on-chain and no wallet is
connected. The page says so in a visible notice and in the footer.

The engine (`web/src/lib/vault.ts`) is pure and adapter-shaped: `quoteDeposit` / `quoteWithdraw`
produce the numbers the UI shows and `applyDeposit` / `applyWithdraw` are the only state
transitions. Replacing those four functions with contract reads and writes is the path to a live
vault; the UI does not need to change.

## Layout

```
web/                 Vite project (source, manifest, lockfile)
  src/lib/vault.ts   loop engine, quotes, persistence
  src/lib/vault.test.ts   vitest unit tests for the engine
  src/components/    Header, Hero, Flywheel, VaultPanel, DepositForm, WithdrawForm, Stats,
                     Positions, ActivityLog, HowItWorks, Footer, Field, TokenSelect, QuoteList
  src/styles/        tokens.css (design tokens), base.css (reset, fonts, focus), components.css
  src/assets/fonts/  Space Grotesk + Inter variable latin subsets (OFL, see LICENSE.md there)
dist/                committed production export (relative asset URLs, `base: './'`)
DESIGN.md            implemented design system
artifacts/validation.md   Better Interface review, checks run, limitations
```

## Install

Node 22 and npm 10 were used. Dependencies are pinned by `web/package-lock.json`.

```sh
cd web
npm ci
```

## Preview locally

Development server with hot reload:

```sh
cd web
npm run dev
```

Serve the committed export exactly as a static host would (any static file server works):

```sh
cd web
npm run preview          # serves ../dist
# or, from the repository root:
python3 -m http.server 8000 --directory dist
```

## Rebuild

```sh
cd web
npm run typecheck        # tsc --noEmit
npm test                 # vitest, engine unit tests
npm run build            # tsc --noEmit && vite build  → writes ../dist
```

`dist/` is the deliverable. Rebuild after any source change and commit the result together with
the source and lockfile; the publisher serves the committed export and does not rebuild.

## Publish

`dist/` is self-contained: `index.html`, one JS bundle, one CSS file, two `.woff2` fonts and a
favicon, all referenced with relative URLs. Upload the folder to any static host, IPFS gateway
or ENS content hash. It works at a subpath (for example `https://host/preview/`) because no
absolute paths are used and there is no client-side routing: sections are plain in-page anchors
(`#vault`, `#positions`, `#how-it-works`).

## Validation results (worker-run, 2026-09-27)

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` (part of `npm run build`) | passed, 0 errors |
| Unit tests | `npm test` | 9 passed (deposit quote, repeat deposit, partial and full withdraw, validation errors, persistence) |
| Production build | `npm run build` | passed; `dist/` = 349 KB (JS 253 KB, CSS 23 KB, fonts 71 KB) |
| Browser: resources | Playwright MCP against `dist/index.html` served at a subpath | all 6 requests 200, 0 console errors or warnings |
| Browser: interactions | deposit (error path, token switch, quote, submit), tab keyboard navigation, partial withdraw, full unwind to USDC, empty state, receipt-card "Withdraw" jump, persistence across reload | all behaved as intended |
| Browser: widths | 1280, 375 and 320 CSS px, including after resize cycles | no horizontal overflow (`scrollWidth` equals viewport) |
| Browser: focus and motion | skip link, focus ring on links/buttons/inputs/tabs; `prefers-reduced-motion: reduce` | ring visible; flywheel animation and smooth scroll disabled under reduced motion |
| Contrast | measured from rendered computed colors (see validation.md) | lowest text pair 4.28:1 (input placeholder), all other text ≥ 4.85:1 |

Limitations: screenshots were inspected in the browser tool but could not be written into the
repository (the tool's filesystem is read-only here), so no screenshot files ship; the
`Reset preview balances` confirm dialog, screen readers, native 200% zoom, forced-colors mode
and real devices were not exercised. Full detail in `artifacts/validation.md`.
