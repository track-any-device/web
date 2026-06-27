'use client';

import React from 'react';
import { HeroGlobe } from './hero-globe';

/* Portal loading state — the hero satellite globe, centred in the content area. Rendered by each
   portal's route-segment loading.tsx, so it sits inside the layout: the header/footer/sidebar stay
   visible and only the page/map region shows the loader. */

export function PortalLoader({ label = 'Locating…', fill = false }: { label?: string; fill?: boolean }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        flex: 1,
        width: '100%',
        // Standalone: reserve 70vh of height. As an overlay (fill) it just fills the
        // positioned parent via flex:1 — forcing 70vh there overflows short panes onto the footer.
        minHeight: fill ? 0 : '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ position: 'relative', width: 'min(82vw, 480px)', height: 'min(82vw, 480px)' }}>
        <HeroGlobe cxFactor={0.5} radiusFactor={0.46} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 99,
            background: 'var(--brand)',
            color: 'var(--brand)',
            animation: 'tad-pulse 1.2s ease-in-out infinite',
          }}
        />
        {label}
      </div>
    </div>
  );
}
