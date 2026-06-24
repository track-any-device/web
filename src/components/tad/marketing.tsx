import React from 'react';
import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { HeroGlobe } from '@/components/tad/hero-globe';

/* TAD-PAK marketing primitives (server-compatible). Compose marketing/shop surfaces from these. */

export interface SectionProps {
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  width?: 'lg' | 'xl';
  children?: React.ReactNode;
  className?: string;
}

export function Section({ eyebrow, title, subtitle, width = 'xl', children, className }: SectionProps) {
  return (
    <section className={['tad-section px-5 py-12 sm:px-6 sm:py-16', className].filter(Boolean).join(' ')}>
      <div className="mx-auto" style={{ maxWidth: width === 'lg' ? 'var(--container-lg)' : 'var(--container-xl)' }}>
        {(eyebrow || title || subtitle) && (
          <header className="mb-8 grid max-w-[640px] gap-2">
            {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
            {title && <h2 className="tad-section__title text-[length:var(--text-3xl)] font-extrabold tracking-[var(--tracking-tighter)]">{title}</h2>}
            {subtitle && <p className="tad-section__subtitle text-[length:var(--text-lg)] text-[var(--text-secondary)]">{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export interface HeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Full-bleed, full-height landing hero with an enlarged right-anchored globe (home page). */
  full?: boolean;
}

export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta, full }: HeroProps) {
  const ctas = (primaryCta || secondaryCta) && (
    <div className="tad-cta-row mt-2 flex flex-wrap gap-3">
      {primaryCta && <Link href={primaryCta.href} className="tad-btn tad-btn--primary tad-btn--lg">{primaryCta.label}</Link>}
      {secondaryCta && <Link href={secondaryCta.href} className="tad-btn tad-btn--secondary tad-btn--lg">{secondaryCta.label}</Link>}
    </div>
  );

  if (full) {
    return (
      <section
        className="tad-hero tad-hero--full relative flex min-h-[calc(100vh-var(--topbar-h))] items-center overflow-hidden"
        style={{ background: 'radial-gradient(120% 95% at 74% 44%, var(--brand-subtle), var(--surface) 62%)' }}
      >
        <div className="tad-hero__globe-wrap"><HeroGlobe cxFactor={0.76} radiusFactor={0.48} /></div>
        <div className="tad-hero__inner relative z-[1] mx-auto w-full px-6 sm:px-8" style={{ maxWidth: 'var(--container-xl)' }}>
          <div className="tad-hero__copy grid max-w-[560px] gap-5">
            {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
            <h1 className="tad-hero__title text-[length:var(--text-6xl)] font-extrabold leading-[var(--leading-tight)] tracking-[var(--tracking-tighter)]">{title}</h1>
            {subtitle && <p className="tad-hero__subtitle max-w-[500px] text-[length:var(--text-xl)] text-[var(--text-secondary)]">{subtitle}</p>}
            {ctas}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tad-hero tad-hero--panel-wrap p-5 sm:p-6">
      <div
        className="tad-dot-bg tad-hero--panel relative mx-auto overflow-hidden rounded-[var(--radius-2xl)] px-6 py-14 sm:px-10 sm:py-16 md:px-12 md:py-20"
        style={{
          maxWidth: 'var(--container-xl)',
          background: 'linear-gradient(160deg, var(--brand-subtle), var(--surface) 70%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="relative z-[1] grid max-w-[640px] gap-5">
          {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
          <h1 className="tad-hero__title text-[length:var(--text-6xl)] font-extrabold leading-[var(--leading-tight)] tracking-[var(--tracking-tighter)]">{title}</h1>
          {subtitle && <p className="tad-hero__subtitle text-[length:var(--text-xl)] text-[var(--text-secondary)]">{subtitle}</p>}
          {ctas}
        </div>
        <HeroGlobe />
      </div>
    </section>
  );
}

export type ProductCategory = 'car' | 'bike' | 'person';

const CATEGORY_LABEL: Record<ProductCategory, string> = { car: 'Car', bike: 'Bike', person: 'Person tracker' };

export interface ProductCardProps {
  name: string;
  category: ProductCategory;
  image?: string;
  /** Price in PKR (number) — rendered with the Rs prefix and a yearly-subscription note. */
  price?: number;
  href?: string;
  vendor?: string;
  /** Order action (client-side Add-to-cart). When provided, replaces the placeholder "Add to cart"
      link so the grid card can add the real orderable product to the cart. */
  addToCart?: React.ReactNode;
}

export function ProductCard({ name, category, image, price, href = '/shop', vendor, addToCart }: ProductCardProps) {
  return (
    <Card interactive raised flushBody>
      <div className="relative grid aspect-[4/3] place-items-center bg-[var(--surface-sunken)]">
        <span className="absolute left-3 top-3">
          <Badge variant="brand">{CATEGORY_LABEL[category]}</Badge>
        </span>
        {image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={image} alt={name} className="max-h-[78%] max-w-[78%] object-contain" />
          : <span className="text-[length:var(--text-sm)] text-[var(--text-subtle)]">No image</span>}
      </div>
      <div className="grid gap-2 p-5">
        {vendor && <span className="tad-eyebrow">{vendor}</span>}
        <h3 className="text-[length:var(--text-lg)] font-bold">{name}</h3>
        {price != null && (
          <div className="grid gap-0.5">
            <span className="tad-data text-[length:var(--text-2xl)] font-semibold">Rs {price.toLocaleString('en-PK')}</span>
            <span className="text-[length:var(--text-xs)] text-[var(--text-muted)]">Includes 1-year subscription · renew yearly</span>
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={href} className="tad-btn tad-btn--secondary tad-btn--sm">View details</Link>
          {addToCart ?? <Link href={href} className="tad-btn tad-btn--primary tad-btn--sm">View to order</Link>}
        </div>
      </div>
    </Card>
  );
}

export interface ProductDetailProps {
  name: string;
  category: ProductCategory;
  image?: string;
  price?: number;
  vendor?: string;
  features?: string[];
  typeApproved?: boolean;
  /** Order actions (e.g. the client-side Add-to-cart). When provided, replaces the default
      placeholder CTA row so the page can wire real ordering against the Shop API. */
  actions?: React.ReactNode;
}

export function ProductDetail({ name, category, image, price, vendor, features = [], typeApproved = true, actions }: ProductDetailProps) {
  return (
    <div className="grid items-start gap-8 md:grid-cols-2 md:gap-10">
      <Card flushBody>
        <div className="grid aspect-square place-items-center bg-[var(--surface-sunken)]">
          {image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={image} alt={name} className="max-h-[74%] max-w-[74%] object-contain" />
            : <span className="text-[var(--text-subtle)]">No image</span>}
        </div>
      </Card>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{CATEGORY_LABEL[category]}</Badge>
          {typeApproved && <Badge variant="success" dot>Type-approved</Badge>}
          {vendor && <span className="tad-eyebrow">{vendor}</span>}
        </div>
        <h1 className="text-[length:var(--text-4xl)] font-extrabold tracking-[var(--tracking-tighter)]">{name}</h1>
        {features.length > 0 && (
          <ul className="m-0 grid list-none gap-2 p-0">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-none text-[var(--brand)]">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        )}
        {price != null && (
          <div className="grid gap-0.5">
            <span className="tad-data text-[length:var(--text-3xl)] font-semibold">Rs {price.toLocaleString('en-PK')}</span>
            <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">Includes a 1-year subscription — renew yearly to keep tracking, alerts &amp; history live.</span>
          </div>
        )}
        {actions ?? (
          <div className="tad-cta-row mt-2 flex flex-wrap gap-3">
            <Link href="/shop" className="tad-btn tad-btn--secondary tad-btn--lg">Browse the shop</Link>
          </div>
        )}
      </div>
    </div>
  );
}
