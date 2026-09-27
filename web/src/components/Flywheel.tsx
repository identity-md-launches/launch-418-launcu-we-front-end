/**
 * The infinite flywheel: an infinity loop with Bitcoin on the front lobe and OHM on the back.
 * Purely decorative; the hero text carries the meaning. Motion is opt-in via
 * prefers-reduced-motion: no-preference in components.css.
 */
export function Flywheel() {
  return (
    <figure className="flywheel" aria-hidden="true">
      <svg viewBox="0 0 640 320" className="flywheel__svg" focusable="false">
        <defs>
          <linearGradient id="fw-stroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--color-asset-btc)" />
            <stop offset="1" stopColor="var(--color-asset-ohm)" />
          </linearGradient>
        </defs>
        <path
          className="flywheel__track"
          d="M320 160 C 260 60, 120 60, 120 160 S 260 260, 320 160 S 520 60, 520 160 S 380 260, 320 160"
        />
        <path
          className="flywheel__flow"
          d="M320 160 C 260 60, 120 60, 120 160 S 260 260, 320 160 S 520 60, 520 160 S 380 260, 320 160"
        />
        <g className="flywheel__node flywheel__node--btc" transform="translate(120 160)">
          <circle r="44" />
          <text y="12" textAnchor="middle">
            ₿
          </text>
        </g>
        <g className="flywheel__node flywheel__node--ohm" transform="translate(520 160)">
          <circle r="44" />
          <text y="12" textAnchor="middle">
            Ω
          </text>
        </g>
        <text className="flywheel__label" x="120" y="236" textAnchor="middle">
          FRONT
        </text>
        <text className="flywheel__label" x="520" y="236" textAnchor="middle">
          BACK
        </text>
      </svg>
    </figure>
  );
}
