const palettes = [
  ["#0b1730", "#1c3a5e", "#d9b873"],
  ["#1a0f1f", "#4a1d3a", "#e7c58a"],
  ["#07201f", "#0f4a47", "#d9b873"],
  ["#1d1208", "#5a3a14", "#f0d79b"],
  ["#0d1224", "#2b2f6b", "#d9b873"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Abstract generated cover: used until real course photography is uploaded. */
export function CourseArt({ seed, className = "" }: { seed: string; className?: string }) {
  const h = hash(seed);
  const [a, b, g] = palettes[h % palettes.length]!;
  const id = `ca-${h}`;
  const variant = h % 3;
  const threads = Array.from({ length: 9 }, (_, i) => 118 + i * 14);

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Ilustrație curs">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.7" cy="0.25" r="0.7">
          <stop offset="0" stopColor={g} stopOpacity="0.45" />
          <stop offset="1" stopColor={g} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dca3" />
          <stop offset="1" stopColor={g} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-bg)`} />
      <rect width="400" height="300" fill={`url(#${id}-glow)`} />
      {[60, 110, 160, 210].map((r, i) => (
        <circle key={r} cx={variant === 0 ? 290 : variant === 1 ? 110 : 200} cy={variant === 2 ? 150 : 120} r={r} fill="none" stroke={g} strokeOpacity={0.35 - i * 0.07} strokeWidth="1" />
      ))}
      <g transform={`translate(${variant === 0 ? 245 : variant === 1 ? 65 : 155} 0) rotate(${variant === 1 ? -14 : 12} 45 150)`}>
        <rect x="22" y="70" width="46" height="26" rx="9" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2" />
        <path d="M30 96h30l-5 22H35z" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2" strokeLinejoin="round" />
        {threads.map((y, i) => (
          <path key={y} d={`M${34 + i * 0.6} ${y}h${22 - i * 1.2}`} stroke={`url(#${id}-gold)`} strokeWidth="2.4" strokeLinecap="round" />
        ))}
        <path d="M45 118V262" stroke={g} strokeOpacity="0.25" strokeDasharray="2 6" />
      </g>
      <path d="M0 262C90 236 170 282 260 256s110-28 140-8V300H0z" fill="#000" fillOpacity="0.18" />
    </svg>
  );
}
