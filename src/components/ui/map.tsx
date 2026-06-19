'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* TAD-PAK design system — MapMarker (SVG-only port). Styles in src/styles/tad.css.
   shapes: pin (fixed assets), circle (users/employees), arrow (vehicles, rotates to heading),
   flag (incidents). `moving` pulses; `blink` flashes on live update; `color` is tenant-customisable. */

export type MarkerShape = 'pin' | 'circle' | 'arrow' | 'flag';
export type MarkerKind = 'car' | 'truck' | 'asset' | 'generator' | 'container' | 'tool' | 'employee';
export type MarkerStatus = 'moving' | 'idle' | 'parked' | 'offline';

export interface MapMarkerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  shape?: MarkerShape;
  kind?: MarkerKind;
  status?: MarkerStatus;
  color?: string;
  icon?: React.ReactNode;
  heading?: number;
  size?: number;
  top?: number;
  left?: number;
  selected?: boolean;
  blink?: boolean;
  blinkKey?: string | number;
  label?: string;
}

const GLYPHS: Record<MarkerKind, { p: string[]; c: number[][] }> = {
  car: { p: ['M4.5 12.5 6 8.6A2 2 0 0 1 7.9 7.2h8.2a2 2 0 0 1 1.9 1.4l1.5 3.9', 'M3.6 12.5h16.8v3a1 1 0 0 1-1 1h-1.1M7.1 16.5H4.6a1 1 0 0 1-1-1v-3'], c: [[7.3, 16.6, 1.5], [16.7, 16.6, 1.5]] },
  truck: { p: ['M3 7.5h10v8H3z', 'M13 10h4l3 3v2.5h-3', 'M3 15.5h7'], c: [[7, 17, 1.5], [16.5, 17, 1.5]] },
  asset: { p: ['M20 8 12 4 4 8l8 4 8-4z', 'M4 8v8l8 4 8-4V8', 'M12 12v8'], c: [] },
  generator: { p: ['M5 8h14v9H5z', 'M9.5 12 8 15h3l-1.5 3', 'M16 11v5'], c: [] },
  container: { p: ['M4 8h16v9H4z', 'M8 8v9M12 8v9M16 8v9'], c: [] },
  tool: { p: ['M14.7 7.3a3.5 3.5 0 0 0-4.8 4.6L5 17l2 2 5.1-4.9a3.5 3.5 0 0 0 4.6-4.8l-2.3 2.3-1.8-1.8z'], c: [] },
  employee: { p: ['M8.4 17.6a3.6 3.6 0 0 1 7.2 0'], c: [[12, 8.4, 2.7]] },
};

const STATUS_COLOR: Record<MarkerStatus, string> = {
  moving: 'var(--status-moving)', idle: 'var(--status-idle)',
  parked: 'var(--status-parked)', offline: 'var(--status-offline)',
};

const ANCHOR: Record<MarkerShape, string> = {
  pin: 'translate(-50%,-100%)',
  flag: 'translate(-24%,-94%)',
  circle: 'translate(-50%,-50%)',
  arrow: 'translate(-50%,-50%)',
};

const darken = (color: string) => `color-mix(in srgb, ${color} 72%, #000)`;

export function MapMarker({
  shape = 'pin',
  kind = 'asset',
  status = 'parked',
  color,
  icon,
  heading = 0,
  size = 40,
  top,
  left,
  selected = false,
  blink = false,
  blinkKey,
  label,
  onClick,
  className = '',
  style = {},
  ...rest
}: MapMarkerProps) {
  const fill = color || STATUS_COLOR[status] || 'var(--brand)';
  const s = selected ? Math.round(size * 1.16) : size;
  const moving = status === 'moving';

  let w = s, h = Math.round(s * 1.16), vb = '0 0 32 37';
  let inner: React.ReactNode;

  if (shape === 'circle') {
    vb = '0 0 32 32'; h = s;
    inner = (
      <>
        {moving && <circle className="tad-marker__pulse" cx="16" cy="16" r="13" fill={fill} opacity="0.13" />}
        {blink && <circle key={blinkKey} className="tad-marker__flash" cx="16" cy="16" r="15" fill="#fff" />}
        <circle cx="16" cy="16" r={selected ? 14 : 13} fill={fill} stroke="#fff" strokeWidth={selected ? 2.4 : 2} />
        {icon
          ? <g transform="translate(8 8) scale(0.67)" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">{icon}</g>
          : <circle cx="16" cy="16" r="6.4" fill="rgba(0,0,0,0.24)" />}
      </>
    );
  } else if (shape === 'arrow') {
    vb = '0 0 32 36'; h = s;
    inner = (
      <>
        {moving && <circle className="tad-marker__pulse" cx="16" cy="19" r="14" fill={fill} opacity="0.13" />}
        {blink && <circle key={blinkKey} className="tad-marker__flash" cx="16" cy="19" r="16" fill="#fff" />}
        <g transform={`rotate(${heading} 16 19)`} stroke="#fff" strokeWidth={selected ? 1.6 : 1} strokeLinejoin="round">
          <path d="M16 3 5 32l11-6z" fill={fill} fillOpacity="0.62" />
          <path d="M16 3l11 29-11-6z" fill={fill} />
        </g>
      </>
    );
  } else if (shape === 'flag') {
    vb = '0 0 32 40'; w = Math.round(s * 0.9); h = Math.round(s * 1.12);
    inner = (
      <>
        {blink && <circle key={blinkKey} className="tad-marker__flash" cx="9" cy="20" r="16" fill="#fff" />}
        <rect x="7" y="4" width="3.4" height="31" rx="1.6" fill="#2B3A4A" />
        <ellipse cx="9" cy="35.5" rx="5.6" ry="2.4" fill="#F5A524" />
        <circle cx="8.7" cy="4" r="2.4" fill="#AEBccc" />
        <path d="M10.4 5.5 29 14.5 10.4 23.5z" fill={fill} stroke="#fff" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M10.4 5.5 29 14.5 24 14.9z" fill={darken(fill)} opacity="0.5" />
      </>
    );
  } else {
    const glyph = GLYPHS[kind] || GLYPHS.asset;
    inner = (
      <>
        {moving && <circle className="tad-marker__pulse" cx="16" cy="13" r="13" fill={fill} opacity="0.13" />}
        {blink && <circle key={blinkKey} className="tad-marker__flash" cx="16" cy="13" r="13" fill="#fff" />}
        <path d="M16 1.5c-6.1 0-11 4.7-11 10.8 0 7.4 9.2 14.6 10.5 15.6.3.2.7.2 1 0C17.8 26.9 27 19.7 27 12.3 27 6.2 22.1 1.5 16 1.5Z" fill={fill} stroke="#fff" strokeWidth={selected ? 2 : 1.5} />
        <circle cx="16" cy="12.8" r="9" fill="rgba(255,255,255,0.20)" />
        <g transform="translate(9.4 6.3) scale(0.55)" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {icon || (
            <>
              {glyph.p.map((d, i) => <path key={`p${i}`} d={d} />)}
              {glyph.c.map((c, i) => <circle key={`c${i}`} cx={c[0]} cy={c[1]} r={c[2]} />)}
            </>
          )}
        </g>
      </>
    );
  }

  const pos: React.CSSProperties = (top != null || left != null) ? { top: `${top || 0}%`, left: `${left || 0}%` } : {};
  const Tag = (onClick ? 'button' : 'span') as React.ElementType;
  return (
    <Tag
      className={cn('tad-marker', className)}
      style={{ display: 'inline-block', lineHeight: 0, transform: ANCHOR[shape] || ANCHOR.pin, zIndex: selected ? 8 : 3, ...pos, ...style }}
      onClick={onClick}
      aria-label={label || shape}
      title={label}
      {...rest}
    >
      <svg className="tad-marker__svg" width={w} height={h} viewBox={vb} fill="none">
        {inner}
      </svg>
    </Tag>
  );
}

/** Density-driven marker size — shrinks when crowded, grows with zoom. */
export function MarkerSizeForDensity(localCount = 1, zoom = 1): number {
  const base = 26;
  const shrink = Math.min(18, Math.max(0, (localCount - 1) * 3));
  return Math.round((base - shrink) * zoom);
}
