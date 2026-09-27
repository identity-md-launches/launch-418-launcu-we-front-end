const STEPS = [
  {
    title: 'Zap into Bitcoin',
    body: 'Whatever you deposit is swapped to WBTC. Bitcoin is the front of the position.',
    side: 'btc',
  },
  {
    title: 'Mint on f(x)',
    body: 'The WBTC is deposited into f(x) protocol with fxMint and 50% of its value is borrowed as fxUSD.',
    side: 'btc',
  },
  {
    title: 'Swap to OHM, wrap to gOHM',
    body: 'The fxUSD buys OHM, which is wrapped into gOHM. OHM is the back of the position.',
    side: 'ohm',
  },
  {
    title: 'Post to Cooler',
    body: 'gOHM goes into Cooler loans, the credit facility built into Olympus, and USDS is borrowed against it.',
    side: 'ohm',
  },
  {
    title: 'Buy more Bitcoin',
    body: 'The USDS buys more WBTC, which tops up the f(x) position together with the WBTC held back at the start.',
    side: 'btc',
  },
  {
    title: 'Settle at 33% LTV',
    body: 'The loop is sized so the f(x) position lands at a 33% loan-to-value ratio, and you receive a receipt.',
    side: 'btc',
  },
  {
    title: 'Run it again',
    body: 'Deposit more at any time to run the loop on the same receipt. Withdraw part or all to unwind it.',
    side: 'loop',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-title">
      <div className="section__head">
        <h2 id="how-title">How the flywheel turns</h2>
        <p className="section__lede">
          One deposit, seven moves. Bitcoin is the front, OHM is the back, and the loan from the
          back buys more of the front.
        </p>
      </div>
      <ol className="steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className={`step step--${step.side}`}>
            <span className="step__index" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="step__title">{step.title}</h3>
            <p className="step__body">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
