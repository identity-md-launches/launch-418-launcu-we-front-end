import { Flywheel } from './Flywheel';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="eyebrow">Bitcoin Cooler · $BCLR vault</p>
        <h1 id="hero-title">
          Bitcoin in the front, <span className="hero__ohm">OHM</span> in the back.
        </h1>
        <p className="hero__lede">
          An infinite flywheel. Deposit any token and Bitohm zaps it into WBTC, borrows against it
          on f(x), parks the proceeds as gOHM in Olympus Cooler, and buys more Bitcoin. Every
          deposit runs the loop again and hands you a receipt.
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href="#vault">
            Open the vault
          </a>
          <a className="button button--ghost" href="#how-it-works">
            See how the loop works
          </a>
        </div>
      </div>
      <Flywheel />
    </section>
  );
}
