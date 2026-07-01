import React from 'react';
import { Card } from '@/components/ui';
import { Section, ProductCard } from '@/components/tad/marketing';
import { getDeviceTypes } from '@/lib/catalog';
import type { ProductGridData } from '@/lib/pages';

/* Device-type catalogue grid (async server component). Reads live products from the Sanity catalogue
   via getDeviceTypes and filters by category (unless 'all'). NO hardcoded fallback — when the catalog
   is empty (or unreachable) we show an honest empty state, per the catalog rule (real data or empty). */
export async function ProductGrid({ eyebrow, title, subtitle, category = 'all' }: ProductGridData) {
  const products = await getDeviceTypes();
  const items = category === 'all' ? products : products.filter((p) => p.category === category);

  return (
    <Section eyebrow={eyebrow} title={title} subtitle={subtitle}>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug || p.name} {...p} />
          ))}
        </div>
      ) : (
        <Card className="grid place-items-center gap-1 px-6 py-12 text-center">
          <p className="m-0 text-[length:var(--text-lg)] font-semibold">No devices yet</p>
          <p className="m-0 text-[length:var(--text-base)] text-[var(--text-secondary)]">
            Our catalogue is being updated — check back soon.
          </p>
        </Card>
      )}
    </Section>
  );
}
