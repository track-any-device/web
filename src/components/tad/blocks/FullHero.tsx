import React from 'react';
import Link from 'next/link';
import type { FullHeroData } from '@/lib/pages';

/* Full-screen hero block — fills the viewport below the top bar. Text-led with an optional
   image column (no globe — that's HomeHero). All copy comes from Sanity. */

function Cta({ href, label, variant }: { href: string; label: string; variant: 'primary' | 'secondary' }) {
  const cls = `tad-btn tad-btn--${variant} tad-btn--lg`;
  // Internal paths get client-side navigation; mailto:/external hrefs render as plain anchors.
  return href.startsWith('/')
    ? <Link href={href} className={cls}>{label}</Link>
    : <a href={href} className={cls}>{label}</a>;
}

export function FullHero({ eyebrow, title, subtitle, body, imageUrl, primaryCta, secondaryCta }: FullHeroData) {
  const hasImage = !!imageUrl;

  return (
    <section
      className="tad-hero tad-hero--full relative flex min-h-[calc(100vh-var(--topbar-h))] items-center overflow-hidden"
      style={{ background: 'radial-gradient(120% 110% at 82% 28%, var(--brand-subtle), var(--surface) 56%)' }}
    >
      {/* Soft decorative orbs — pure presentation. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-[-12%] top-[10%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: 'var(--brand-subtle)' }} />
        <div className="absolute bottom-[-18%] left-[-10%] h-[360px] w-[360px] rounded-full blur-3xl" style={{ background: 'var(--surface-sunken)' }} />
      </div>

      <div
        className={`relative z-[1] mx-auto grid w-full gap-10 px-6 py-16 sm:px-8 lg:px-10 ${hasImage ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]' : ''}`}
        style={{ maxWidth: 'var(--container-xl)' }}
      >
        <div className="grid max-w-[720px] content-center gap-6">
          {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
          <h1 className="tad-hero__title max-w-[14ch] text-[clamp(2.75rem,7vw,5.25rem)] font-extrabold leading-[0.98] tracking-[var(--tracking-tighter)]">
            {title}
          </h1>
          {subtitle && (
            <p className="tad-hero__subtitle max-w-[62ch] text-[length:var(--text-xl)] leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
          )}
          {body && (
            <p className="max-w-[62ch] text-[length:var(--text-lg)] leading-relaxed text-[var(--text-secondary)]">{body}</p>
          )}
          {(primaryCta?.label && primaryCta?.href) || (secondaryCta?.label && secondaryCta?.href) ? (
            <div className="tad-cta-row mt-2 flex flex-wrap gap-3">
              {primaryCta?.label && primaryCta?.href && <Cta href={primaryCta.href} label={primaryCta.label} variant="primary" />}
              {secondaryCta?.label && secondaryCta?.href && <Cta href={secondaryCta.href} label={secondaryCta.label} variant="secondary" />}
            </div>
          ) : null}
        </div>

        {hasImage && (
          <div className="grid content-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="w-full rounded-[var(--radius-2xl)] border border-[var(--border)] object-cover shadow-lg"
            />
          </div>
        )}
      </div>
    </section>
  );
}
