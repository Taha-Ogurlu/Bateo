import { useId } from "react";

/**
 * BATEO marka bileşenleri — kullanıcının sağladığı SVG'lerden uyarlanmıştır.
 * Renkler tema ile değişir: gradyan `--accent` → `--accent-2`, yazı `currentColor`.
 */

export function BateoIcon({ size = 36, className }: { size?: number; className?: string }) {
  const raw = useId();
  const id = raw.replace(/[:]/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="BATEO"
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--accent)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent-2)" }} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#bg-${id})`} />
      <rect x="116" y="120" width="280" height="300" rx="44" fill="#ffffff" />
      <path d="M140 176h232" stroke="#e3e6f6" strokeWidth="6" strokeLinecap="round" />
      <rect x="186" y="88" width="28" height="66" rx="14" fill="#ffffff" stroke="var(--accent)" strokeWidth="8" />
      <rect x="298" y="88" width="28" height="66" rx="14" fill="#ffffff" stroke="var(--accent)" strokeWidth="8" />
      <path
        d="M198 200V380M198 200H260a42 42 0 0 1 0 84H198M198 284H270a48 48 0 0 1 0 96H198"
        fill="none"
        stroke={`url(#bg-${id})`}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="372" cy="396" r="44" fill="var(--success)" stroke="var(--accent)" strokeWidth="10" />
      <path
        d="M352 396l14 14 28-30"
        fill="none"
        stroke="#ffffff"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BateoLogo({ height = 38, className }: { height?: number; className?: string }) {
  const raw = useId();
  const id = raw.replace(/[:]/g, "");
  const width = Math.round((740 / 200) * height);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 740 200"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="BATEO"
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--accent)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent-2)" }} />
        </linearGradient>
      </defs>

      {/* İkon */}
      <g transform="translate(0 4) scale(.375)">
        <rect width="512" height="512" rx="116" fill={`url(#g-${id})`} />
        <rect x="116" y="120" width="280" height="300" rx="44" fill="#ffffff" />
        <path d="M140 176h232" stroke="#e3e6f6" strokeWidth="6" strokeLinecap="round" />
        <rect x="186" y="88" width="28" height="66" rx="14" fill="#ffffff" stroke="var(--accent)" strokeWidth="8" />
        <rect x="298" y="88" width="28" height="66" rx="14" fill="#ffffff" stroke="var(--accent)" strokeWidth="8" />
        <path
          d="M198 200V380M198 200H260a42 42 0 0 1 0 84H198M198 284H270a48 48 0 0 1 0 96H198"
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="372" cy="396" r="44" fill="var(--success)" stroke="var(--accent)" strokeWidth="10" />
        <path
          d="M352 396l14 14 28-30"
          fill="none"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* BATEO yazısı (tema ile renk değiştirir) */}
      <g
        transform="translate(250 50)"
        fill="none"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 0V100M0 0H34a24 24 0 0 1 0 48H0M0 48H40a26 26 0 0 1 0 52H0" />
        <path transform="translate(92 0)" d="M0 100 35 0l35 100M13 66H57" />
        <path transform="translate(188 0)" d="M0 0H70M35 0V100" />
        <path transform="translate(284 0)" d="M62 0H0V100H62M0 50H50" />
        <rect x="372" y="0" width="76" height="100" rx="38" />
      </g>
    </svg>
  );
}
