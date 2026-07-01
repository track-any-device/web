import React from 'react';
import Link from 'next/link';
import type { CtaBandData } from '@/lib/pages';

/* Full-width CTA band. `brand` tone = Pakistan green surface with inverse text; `sand` tone = warm
   sunken surface. Renders a title/subtitle + a single Button-styled CTA link. */
export function CtaBand({ title, subtitle, cta, tone = 'brand' }: CtaBandData) {
  const isBrand = tone !== 'sand';
  return (
    <section className="tad-section px-5 py-12 sm:px-6 sm:py-16">
      <div
        className="mx-auto grid gap-5 rounded-[var(--radius-2xl)] px-6 py-12 text-center sm:px-10 sm:py-16"
        style={{
          maxWidth: 'var(--container-lg)',
          background: isBrand ? 'var(--brand)' : 'var(--surface-sunken)',
          color: isBrand ? 'var(--text-on-brand)' : 'var(--text)',
          border: isBrand ? 'none' : '1px solid var(--border)',
        }}
      >
        <div className="mx-auto grid max-w-[640px] gap-3">
          {title && (
            <h2 className="text-[length:var(--text-3xl)] font-extrabold tracking-[var(--tracking-tighter)]">{title}</h2>
          )}
          {subtitle && (
            <p
              className="text-[length:var(--text-lg)]"
              style={{ color: isBrand ? 'color-mix(in srgb, var(--text-on-brand) 82%, transparent)' : 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {cta?.label && cta?.href && (
          <div className="flex justify-center">
            <Link
              href={cta.href}
              className={`tad-btn tad-btn--lg ${isBrand ? 'tad-btn--secondary' : 'tad-btn--primary'}`}
            >
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
