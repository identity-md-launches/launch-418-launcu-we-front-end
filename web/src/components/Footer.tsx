interface Props {
  onReset: () => void;
}

export function Footer({ onReset }: Props) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__note">
          Bitohm is the vault front end for the Bitcoin Cooler ($BCLR) loop built on the IdentityMD
          network. The contract has not been deployed, so this page runs the loop locally with
          reference prices and keeps its state in your browser. Nothing here is financial advice.
        </p>
        <div className="site-footer__links">
          <a href="https://explorer.imd.fun/jobs/9df471c0-b9f9-474e-b2e1-1aa86c7f7412">
            Read the contract job on the IMD explorer
          </a>
          <button type="button" className="button button--ghost button--small" onClick={onReset}>
            Reset preview balances
          </button>
        </div>
      </div>
    </footer>
  );
}
