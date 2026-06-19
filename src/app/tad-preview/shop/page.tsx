import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Section } from '@/components/tad/marketing';
import { getDeviceTypes } from '@/lib/catalog';
import { ShopGrid } from './shop-grid';

/* Shop surface (PREVIEW at /tad-preview/shop). Catalog from Sanity (server-side) → ShopGrid. */

export default async function ShopPreview() {
  const products = await getDeviceTypes();
  return (
    <SiteShell>
      <Section
        eyebrow="Shop"
        title="GPS trackers for every ride"
        subtitle="Cash on delivery across Pakistan — every device includes a 1-year subscription."
      >
        <ShopGrid products={products} />
      </Section>
    </SiteShell>
  );
}
