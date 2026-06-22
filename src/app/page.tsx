import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Hero, Section, ProductCard, type ProductCategory } from '@/components/tad/marketing';
import { PRODUCTS } from '@/lib/products';

/* Rebranded homepage composition (PREVIEW at /tad-preview/home).
   NOTE: product data is representative placeholder (../_products) — wire to Sanity in Phase 4/5b.
   This route is additive and does not touch the live GraphQL homepage at /. */

function Grid({ category }: { category: ProductCategory }) {
  const items = PRODUCTS.filter((p) => p.category === category);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
      {items.map((p) => <ProductCard key={p.name} {...p} />)}
    </div>
  );
}

export default function TadHomePreview() {
  return (
    <SiteShell>
      <Hero
        full
        eyebrow="Real-time GPS tracking · Pakistan"
        title="Always know where everything is."
        subtitle="Friendly, reliable GPS tracking for your car, bike, and team — get a ping the moment anything moves."
        primaryCta={{ label: 'Start tracking', href: '/shop' }}
        secondaryCta={{ label: 'Explore for business', href: '/business' }}
      />
      <Section eyebrow="For you" title="Track your car" subtitle="Live location, trips, and instant move alerts.">
        <Grid category="car" />
      </Section>
      <Section eyebrow="For you" title="Track your bike" subtitle="Compact trackers built for two wheels.">
        <Grid category="bike" />
      </Section>
      <Section eyebrow="For teams" title="Track your people" subtitle="Keep your field team safe with live person trackers.">
        <Grid category="person" />
      </Section>
    </SiteShell>
  );
}
