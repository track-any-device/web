import React from 'react';

/* Decorative GPS hero visual — a wireframe globe with brand location pins (one live-pinging),
   orbiting satellites, and a sky-arc. Pure SVG + CSS (see .tad-hero-globe in tad.css). */

function Pin({ x, y, ping = false }: { x: number; y: number; ping?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {ping && <circle className="tad-globe__ping" cx="0" cy="0" r="6" />}
      <path
        d="M0 -16c-6 0-11 5-11 11 0 8 11 19 11 19s11-11 11-19c0-6-5-11-11-11z"
        fill="var(--brand)"
      />
      <circle cx="0" cy="-5" r="4" fill="#fff" />
    </g>
  );
}

function Satellite({ x, y, r = 0, cls }: { x: number; y: number; r?: number; cls?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} className={cls} stroke="var(--brand)" strokeWidth="2" fill="var(--surface)">
      <rect x="-7" y="-7" width="14" height="14" rx="3" />
      <rect x="-20" y="-4" width="10" height="8" rx="1.5" />
      <rect x="10" y="-4" width="10" height="8" rx="1.5" />
      <line x1="0" y1="7" x2="0" y2="15" />
    </g>
  );
}

export function HeroGlobe() {
  return (
    <div className="tad-hero-globe" aria-hidden="true">
      <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="tadGlobeFill" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.16" />
            <stop offset="70%" stopColor="var(--brand)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.10" />
          </radialGradient>
        </defs>

        {/* orbit paths */}
        <ellipse cx="220" cy="220" rx="205" ry="80" transform="rotate(-22 220 220)" stroke="var(--brand)" strokeOpacity="0.18" strokeDasharray="3 7" />
        <ellipse cx="220" cy="220" rx="200" ry="120" transform="rotate(26 220 220)" stroke="var(--brand)" strokeOpacity="0.12" strokeDasharray="3 7" />

        {/* globe */}
        <circle cx="220" cy="220" r="150" fill="url(#tadGlobeFill)" stroke="var(--brand)" strokeOpacity="0.28" />
        {/* parallels */}
        <ellipse cx="220" cy="220" rx="150" ry="50" stroke="var(--brand)" strokeOpacity="0.16" />
        <ellipse cx="220" cy="220" rx="150" ry="102" stroke="var(--brand)" strokeOpacity="0.12" />
        {/* meridians */}
        <ellipse cx="220" cy="220" rx="50" ry="150" stroke="var(--brand)" strokeOpacity="0.16" />
        <ellipse cx="220" cy="220" rx="102" ry="150" stroke="var(--brand)" strokeOpacity="0.12" />
        <line x1="220" y1="70" x2="220" y2="370" stroke="var(--brand)" strokeOpacity="0.12" />

        {/* location pins */}
        <Pin x={172} y={168} />
        <Pin x={278} y={150} />
        <Pin x={262} y={268} ping />

        {/* satellites */}
        <Satellite x={44} y={150} r={-20} cls="tad-globe__sat" />
        <Satellite x={398} y={262} r={18} cls="tad-globe__sat tad-globe__sat--slow" />
      </svg>
    </div>
  );
}
