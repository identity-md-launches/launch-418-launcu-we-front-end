# Bitohm design system

Extracted from the final source on 2026-09-27. Paths are relative to the repository root. The
canonical color notation is `oklch()`; keep it when adding colors.

## Overview

Bitohm is a one-page vault for the Bitcoin Cooler loop, aimed at DeFi users who already know
what f(x), OHM, gOHM and Cooler are. The visual character follows the OlympusDAO register: a warm
charcoal page, a single gold accent for everything interactive, generous rounded surfaces and a
geometric display face. Bitcoin orange appears only as an asset mark for WBTC (the "front") and the
flywheel node; gold doubles as the OHM mark (the "back"). The page is dark-only by design; there is
no light theme or theme switch.

Hierarchy comes from size and weight (one display face for headings, values and buttons; one text
face for everything else), from surface tone (page → card → control), and from a single filled
gold action per view. Density is relaxed: 16px card padding, 24px section gaps, 96px between page
sections. Composition is a stacked page of sections; the vault section is the only two-column
layout. The hero's split layout and the infinity-loop figure are that page's arrangement, not a
rule for future pages.

## Colors

Source: `web/src/styles/tokens.css`. Two tiers: primitives (`--charcoal-*`, `--gold-*`,
`--orange-*`, `--green-*`, `--red-*`) are never used in components; semantic tokens are the only
tier `components.css` references.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Page background | `--color-bg-page` | `--charcoal-900` = `oklch(0.17 0.007 70)` | `html`, body (with a faint gold radial glow at the top in `base.css`) |
| Deep background | `--color-bg-page-deep` | `--charcoal-950` = `oklch(0.13 0.006 70)` | tab strip well, quote box, footer |
| Surface | `--color-bg-surface` | `--charcoal-800` = `oklch(0.21 0.008 70)` | cards, panel, stat tiles, activity rows, steps |
| Raised surface | `--color-bg-surface-raised` | `--charcoal-700` = `oklch(0.26 0.009 70)` | selected tab |
| Control | `--color-bg-control` / `-hover` | `--charcoal-700` / `--charcoal-600` | inputs, selects, ghost-button hover |
| Accent soft | `--color-bg-accent-soft` | `oklch(0.86 0.11 85 / 0.12)` | preview notice, badges, inline-button hover |
| Danger / success soft | `--color-bg-danger-soft`, `--color-bg-success-soft` | red/green at 14% | reserved for status surfaces (currently unused by components) |
| Primary text | `--color-text-primary` | `--charcoal-100` = `oklch(0.96 0.006 70)` | headings, values, input text |
| Secondary text | `--color-text-secondary` | `--charcoal-300` = `oklch(0.76 0.012 70)` | ledes, labels, step bodies, nav links |
| Muted text | `--color-text-muted` | `--charcoal-400` = `oklch(0.62 0.012 70)` | hints, captions, placeholders, footer note |
| Text on accent | `--color-text-on-accent` | `--charcoal-950` | text on gold buttons and asset marks |
| Accent text | `--color-text-accent` | `--gold-400` = `oklch(0.86 0.11 85)` (≈ `#F8CC82`) | eyebrow, links, "OHM" in the headline, quote total, inline buttons |
| Danger text | `--color-text-danger` | `--red-500` = `oklch(0.72 0.19 25)` | field errors (always with a ⚠ glyph and text, never color alone) |
| Success text | `--color-text-success` | `--green-500` | reserved (unused) |
| Border subtle / strong | `--color-border-subtle`, `--color-border-strong` | white at 8% / 16% | control borders, dividers, header rule, ghost buttons |
| Border accent / danger | `--color-border-accent`, `--color-border-danger` | `--gold-500`, `--red-500` | focused control, invalid control |
| Accent solid / hover / active | `--color-accent-solid`, `-hover`, `-active` | `--gold-400`, `--gold-300`, `--gold-500` | the one filled action per view, checkbox accent, selection |
| Focus ring | `--color-focus-ring` | `--gold-300` = `oklch(0.91 0.08 85)` | `:focus-visible` outline, 2px, offset 2px (inset on inputs/tabs) |
| Asset marks | `--color-asset-btc`, `--color-asset-ohm` | `--orange-500` = `oklch(0.74 0.17 60)` (≈ `#F7931A`), `--gold-400` | token circles, flywheel nodes, step top borders, activity dot; category only, never interactive |

Measured contrast (rendered pairs, WCAG 2 ratio, from the browser session recorded in
`artifacts/validation.md`): primary text on page 17.0:1, secondary on page 8.9:1, secondary on
surface 8.2:1, muted on surface 4.85:1, gold accent text on page 12.5:1, dark text on gold button
13.1:1, input placeholder on control 4.28:1, focus ring on page 14.6:1.

Rules: reuse `--color-text-accent` / `--color-accent-solid` for anything clickable and nothing
else; add a semantic token rather than reaching for a primitive; there is one accent hue, so a
second colored fill on the same view must encode a state or category, not a peer action.

## Typography

Fonts are bundled locally in `web/src/assets/fonts/` (OFL, latin subset, variable weight axis)
and declared in `web/src/styles/base.css` with `font-display: swap`:

- `--font-display`: `'Space Grotesk Variable'`, weight axis 300–700, fallback `'Segoe UI', system-ui, sans-serif`. Headings, stat values, amount input, buttons, tabs, badges, wordmark.
- `--font-body`: `'Inter Variable'`, weight axis 100–900, fallback `'Segoe UI', system-ui, sans-serif`. Everything else.

Scale (tokens in `tokens.css`, rem-based):

| Token | Size | Role and treatment |
| --- | --- | --- |
| `--font-size-display` | `clamp(2.25rem, 1.5rem + 3.5vw, 4rem)` | `h1`, weight 600, `letter-spacing: -0.02em`, line-height 1.1, `text-wrap: balance` |
| `--font-size-heading` | 1.75rem (28px) | `h2` section titles, weight 600, `-0.01em` |
| `--font-size-title` | 1.375rem (22px) | `h3`, empty-state titles, wordmark, amount input text |
| `--font-size-value` | 1.5rem (24px) | stat values (`.stat__value`), tabular numbers |
| `--font-size-body-lg` | 1.125rem (18px) | ledes, receipt titles, step titles |
| `--font-size-body` | 1rem (16px) | body copy, buttons, selects, inputs (never below 16px so iOS does not zoom) |
| `--font-size-label` | 0.875rem (14px) | field labels, nav, notice, quote rows, step bodies, footer |
| `--font-size-caption` | 0.75rem (12px) | hints, errors, badges, stat subs, step index |

Line heights: `--line-height-tight` 1.1 (headings), `--line-height-snug` 1.3 (buttons, hints),
`--line-height-body` 1.55 (root). Uppercase labels (`.eyebrow`, `.badge`) use
`--tracking-caps: 0.08em`. Body paragraphs cap the measure at `--measure: 62ch` and use
`text-wrap: pretty`. Every changing number (`.stat__value`, `.quote__row`, `.receipt__grid dd`,
`.activity__item`, amount input) sets `font-variant-numeric: tabular-nums`. Weights used: 400
(body), 500 (labels, nav), 600 (headings, buttons), 700 (wordmark, token marks). Links use
`from-font` underline metrics with `text-underline-offset: 0.12em`. Smoothing is set once on
`html`.

## Layout

Source: `web/src/styles/components.css`. Spacing is a 4px scale: `--space-1` 4 · `-2` 8 · `-3` 12
· `-4` 16 · `-5` 24 · `-6` 32 · `-7` 48 · `-8` 64 · `-9` 96 (rem values).

- **Page frame** `.page`: `width: min(100% - 2 * var(--gutter), 72rem)`, centered; `--gutter`
  is 16px below 48rem and 32px above. Sections stack with a 96px gap. All page-level and section
  grids use `grid-template-columns: minmax(0, 1fr)` plus `min-width: 0` on children so a wide
  min-content (wrapping button rows, long option text) can never widen the page. Start every new
  page from `.page` > `.section` > `.section__head`.
- **Header** `.site-header`: sticky, translucent (`backdrop-filter: blur(16px)`), 64px tall
  (`--header-height: 4rem`). Below 40rem the nav wraps to a second row and `--header-height`
  becomes 8rem; anchored `[id]` targets use `scroll-margin-top: calc(var(--header-height) + 16px)`.
- **Hero**: one column; at ≥ 56rem `minmax(0, 7fr) minmax(0, 5fr)` with the flywheel figure
  trailing.
- **Vault** `.vault-layout`: DOM order is panel then stats. One column below 56rem (panel first,
  the primary task); at ≥ 56rem `grid-template-areas: 'stats panel'` with the panel fixed at
  `minmax(0, 26rem)` on the trailing side. Stat tiles `.stat-grid` are one column below 26rem and
  two columns above.
- **Card grids**: receipts `repeat(auto-fill, minmax(min(100%, 20rem), 1fr))`, steps
  `repeat(auto-fill, minmax(min(100%, 16rem), 1fr))`; the receipt detail list is a fixed 2×3.
- **Breakpoints** come from content: 26rem (stat pairs), 40rem (header wrap, activity time
  column), 48rem (gutter), 56rem (two-column hero and vault). Logical properties
  (`inset-inline`, `padding-inline`, `margin-inline-start`, `border-block-start`) are used for
  direction-dependent spacing.
- **Observed**: no horizontal overflow at 320, 375 and 1280 CSS px (also after resize cycles).
  Widths between 375 and 1280 other than the breakpoints above were not individually inspected;
  native 200% zoom was not tested.
- **Safe areas**: footer bottom padding and the toast region add `env(safe-area-inset-bottom)`.

## Elevation & Depth

Depth is tonal first, shadow second. Surfaces step `page → surface → control/raised` by
lightness. Two layered shadow tokens act as the "border" of surfaces:

- `--shadow-surface`: `0 0 0 1px white/6%` + `0 1px 2px black/30%` — cards, stat tiles, steps,
  activity rows, selected tab.
- `--shadow-raised`: 1px white/8% ring + `0 8px 24px black/35%` + `0 2px 6px black/30%` — the
  vault panel and toast.

Real borders are structural only: `--color-border-subtle` on inputs/selects and the header rule,
`--color-border-strong` on ghost buttons, the placeholder box (dashed) and the flywheel track, and
state borders (`--color-border-accent` on `:focus-within`, `--color-border-danger` on invalid). The
sticky header floats over content with blur. The hero figure has a soft gold radial glow
(`.flywheel::before`), decorative and `pointer-events: none`.

## Shapes

- `--radius-control` 8px: inputs, selects, buttons, tabs, quote box, activity rows, notice.
- `--radius-group` 12px: the tab strip (8px tab + 4px padding, concentric).
- `--radius-card` 24px: cards, stat tiles, panel, steps (8px inner controls + 16px padding,
  concentric).
- `--radius-pill` 999px: badges.
- Circles: token marks (2rem), flywheel nodes, activity dots.
- Steps carry a 3px top border in the asset color of their side of the loop (`.step--btc`,
  `.step--ohm`), neutral for the "run it again" step.

## Components

All components live in `web/src/components/` and are plain React function components styled by
class names in `components.css`; there is no exported library.

- **Button** (`.button` in `components.css`, used as `<button>` or `<a>`): variants
  `--primary` (gold fill, the one filled action per view), `--ghost` (transparent, strong border),
  `--inline` (text-only gold, 32px tall with a pseudo-element extending the hit area to 44px),
  `--block` (full width), `--small` (40px). 44px minimum height, `scale: 0.96` on press,
  120ms `cubic-bezier(0.2, 0, 0, 1)` transitions on color and scale only. Hover fills are gated
  off under `@media (hover: none)`.
- **Header** (`Header.tsx`, `Wordmark.tsx`): brand link to `#top`, `<nav aria-label="Page
  sections">` with anchor links, `Preview` badge. Precede it with the `.skip-link` in `App.tsx`.
- **Hero + Flywheel** (`Hero.tsx`, `Flywheel.tsx`): eyebrow, `h1`, lede, two actions; the
  `<figure aria-hidden>` infinity SVG animates a gradient dash (6s linear) only under
  `prefers-reduced-motion: no-preference`.
- **Stats** (`Stats.tsx`, `.stat-grid` / `.stat`): a `<dl>` of four tiles (label `dt`, value
  `dd.stat__value` with `.stat__unit`, sub-line `dd.stat__sub`). Values are tabular numbers;
  empty state shows `0` and `—`.
- **VaultPanel** (`VaultPanel.tsx`, `.panel`, `.tabs`): ARIA tabs (`role=tablist/tab/tabpanel`),
  roving `tabindex`, Arrow/Home/End keys, `data-tab` attribute for programmatic focus. Panels render
  only the active form.
- **Field** (`Field.tsx`, `.field`): label + control + hint or error. Errors set
  `aria-invalid` and `aria-describedby` on the control and render `.field__error` with a ⚠ glyph.
  The `trailing` slot holds an inline action (`Use max`).
- **Amount input** (`.amount-input`): text input with `inputmode="decimal"`, display face at
  22px, unit suffix; 48px tall; focus moves the ring inset (`outline-offset: -2px`) and colors the
  wrapper border gold. Disabled state (full unwind) shows secondary text and `not-allowed`.
- **TokenSelect** (`TokenSelect.tsx`, `.token-select`): native `<select>` with a colored
  `.token-mark` circle (₿ orange, Ω gold, Ξ / $ neutral). Plain `.select` is the same control
  without the mark.
- **QuoteList** (`QuoteList.tsx`, `.quote`): title + `<dl>` rows; the `emphasis` row gets a
  divider and gold value. Used for "What the loop will do" and "What unwinding will do".
- **DepositForm / WithdrawForm**: validate on submit and on input, keep the submit button enabled,
  focus the amount on error, and label the button with the consequence (`Deposit ETH`,
  `Unwind receipt #2`).
- **Positions** (`Positions.tsx`, `.receipt-list` / `.receipt`): card per receipt with a
  `.badge` LTV, a 2-column `<dl>`, and two ghost actions that switch the panel tab and focus it.
  Empty state `.empty` = title, one sentence, one primary action.
- **ActivityLog** (`ActivityLog.tsx`, `.activity`): ordered list, orange dot for deposits and
  muted dot for withdrawals/unwinds (kind is also in the text), `<time>` elements.
- **HowItWorks** (`HowItWorks.tsx`, `.steps` / `.step`): numbered cards with asset-colored top
  borders.
- **Notice** (`.notice`, `role="note"`): gold-tinted information box for the preview disclaimer.
- **Toast / status** (`.toast-region` `role="status" aria-live="polite"`, `.toast`): a stable
  live region always in the DOM; the light toast appears for 8s after each action, 200ms fade/rise
  under no-preference only.
- **Footer** (`Footer.tsx`): disclaimer, explorer link, `Reset preview balances` ghost button
  (native `confirm()` when receipts exist).

## Do's and Don'ts

- Start a new page from `.page` and `.section` with a `.section__head` (`h2` + `.section__lede`);
  keep one `h1` per page and descend heading levels without skipping.
- Use `.button--primary` for exactly one action per view; peers are `.button--ghost`, small
  in-context actions are `.button--inline`.
- Put interactive color only on interactive things: gold text or fill means clickable. Use
  `--color-asset-*` only for token/side marks and never as text color.
- Reuse `Field` for any labelled control so `aria-describedby`, error text and the hint slot stay
  consistent; never rely on a placeholder as the label.
- Keep numbers in `tabular-nums` containers and format them through `web/src/lib/format.ts`.
- Do not add a light theme, a second accent hue, hover-only states, or motion outside a
  `prefers-reduced-motion: no-preference` block.
- Do not introduce hex or `rgb()` colors; extend `tokens.css` with a primitive and a semantic token
  in `oklch()`.
- Do not remove the `minmax(0, 1fr)` / `min-width: 0` guards from page, section, layout and form
  grids; Chromium sizes wrapping flex rows by the sum of their items and will widen the page.

Recipe for one more page: copy `web/index.html` and `App.tsx`'s frame (skip link, `Header`,
`<main class="page">`, `Footer`, status region), add `.section` blocks built from `Stats`,
`.card`, `QuoteList` and `Field`, and keep the sticky header offsets by giving every anchored
element an `id`.
