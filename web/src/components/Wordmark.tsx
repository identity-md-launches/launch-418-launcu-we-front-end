export function Wordmark() {
  return (
    <span className="wordmark">
      <svg
        className="wordmark__mark"
        viewBox="0 0 64 64"
        width="28"
        height="28"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M14 32c0-6 4.5-10 10-10 4.2 0 6.8 2.4 8 4.6C33.2 24.4 35.8 22 40 22c5.5 0 10 4 10 10s-4.5 10-10 10c-4.2 0-6.8-2.4-8-4.6C30.8 39.6 28.2 42 24 42c-5.5 0-10-4-10-10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="32" r="4" className="wordmark__btc" />
        <circle cx="40" cy="32" r="4" className="wordmark__ohm" />
      </svg>
      <span className="wordmark__text">Bitohm</span>
    </span>
  );
}
