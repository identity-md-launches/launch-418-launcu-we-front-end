import { Wordmark } from './Wordmark';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#top" aria-label="Bitohm, back to top">
          <Wordmark />
        </a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="#vault">Vault</a>
          <a href="#positions">Positions</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <span className="badge badge--preview" title="No contract is deployed yet">
          Preview
        </span>
      </div>
    </header>
  );
}
