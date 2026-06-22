import React from 'react';
import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { HeroGlobe3D } from '@/components/tad/hero-globe-3d';

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
    <section className={className} style={{ padding: 'var(--space-16) var(--space-6)' }}>
      <div style={{ maxWidth: width === 'lg' ? 'var(--container-lg)' : 'var(--container-xl)', margin: '0 auto' }}>
        {(eyebrow || title || subtitle) && (
          <header style={{ display: 'grid', gap: 8, marginBottom: 'var(--space-8)', maxWidth: 640 }}>
            {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
            {title && <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, letterSpacing: 'var(--tracking-tighter)' }}>{title}</h2>}
            {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>{subtitle}</p>}
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
}

export function Hero({ eyebrow, title, subtitle, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section style={{ padding: 'var(--space-6)' }}>
      <div
        className="tad-dot-bg"
        style={{
          position: 'relative', maxWidth: 'var(--container-xl)', margin: '0 auto',
          borderRadius: 'var(--radius-2xl)', overflow: 'hidden',
          background: 'linear-gradient(160deg, var(--brand-subtle), var(--surface) 70%)',
          border: '1px solid var(--border)', padding: 'var(--space-20) var(--space-12)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, display: 'grid', gap: 'var(--space-5)' }}>
          {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
          <h1 style={{ fontSize: 'var(--text-6xl)', lineHeight: 'var(--leading-tight)', fontWeight: 800, letterSpacing: 'var(--tracking-tighter)' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-secondary)' }}>{subtitle}</p>}
          {(primaryCta || secondaryCta) && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
              {primaryCta && <Link href={primaryCta.href} className="tad-btn tad-btn--primary tad-btn--lg">{primaryCta.label}</Link>}
              {secondaryCta && <Link href={secondaryCta.href} className="tad-btn tad-btn--secondary tad-btn--lg">{secondaryCta.label}</Link>}
            </div>
          )}
        </div>
        <HeroGlobe3D />
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
}

export function ProductCard({ name, category, image, price, href = '/shop', vendor }: ProductCardProps) {
  return (
    <Card interactive raised flushBody>
      <div style={{ aspectRatio: '4 / 3', background: 'var(--surface-sunken)', display: 'grid', placeItems: 'center', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 12, left: 12 }}>
          <Badge variant="brand">{CATEGORY_LABEL[category]}</Badge>
        </span>
        {image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={image} alt={name} style={{ maxWidth: '78%', maxHeight: '78%', objectFit: 'contain' }} />
          : <span style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)' }}>No image</span>}
      </div>
      <div style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)' }}>
        {vendor && <span className="tad-eyebrow">{vendor}</span>}
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{name}</h3>
        {price != null && (
          <div style={{ display: 'grid', gap: 2 }}>
            <span className="tad-data" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}>Rs {price.toLocaleString('en-PK')}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Includes 1-year subscription · renew yearly</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Link href={href} className="tad-btn tad-btn--secondary tad-btn--sm">View details</Link>
          <Link href={href} className="tad-btn tad-btn--primary tad-btn--sm">Add to cart</Link>
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
}

export function ProductDetail({ name, category, image, price, vendor, features = [], typeApproved = true }: ProductDetailProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-10)', alignItems: 'start' }}>
      <Card flushBody>
        <div style={{ aspectRatio: '1 / 1', background: 'var(--surface-sunken)', display: 'grid', placeItems: 'center' }}>
          {image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={image} alt={name} style={{ maxWidth: '74%', maxHeight: '74%', objectFit: 'contain' }} />
            : <span style={{ color: 'var(--text-subtle)' }}>No image</span>}
        </div>
      </Card>
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge variant="brand">{CATEGORY_LABEL[category]}</Badge>
          {typeApproved && <Badge variant="success" dot>Type-approved</Badge>}
          {vendor && <span className="tad-eyebrow">{vendor}</span>}
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, letterSpacing: 'var(--tracking-tighter)' }}>{name}</h1>
        {features.length > 0 && (
          <ul style={{ display: 'grid', gap: 8, padding: 0, margin: 0, listStyle: 'none' }}>
            {features.map((f) => (
              <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--brand)', flex: 'none' }}>
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        )}
        {price != null && (
          <div style={{ display: 'grid', gap: 2 }}>
            <span className="tad-data" style={{ fontSize: 'var(--text-3xl)', fontWeight: 600 }}>Rs {price.toLocaleString('en-PK')}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Includes a 1-year subscription — renew yearly to keep tracking, alerts &amp; history live.</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Link href="/checkout" className="tad-btn tad-btn--primary tad-btn--lg">Add to cart</Link>
          <Link href="/checkout" className="tad-btn tad-btn--secondary tad-btn--lg">Buy now · Cash on delivery</Link>
        </div>
      </div>
    </div>
  );
}
