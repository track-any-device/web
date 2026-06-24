import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Section } from '@/components/tad/marketing';
import { getDeviceTypes } from '@/lib/catalog';
import { getShopProducts } from '@/lib/shop-api';
import { ShopGrid } from './shop-grid';

/* Shop surface. Catalogue (presentation) from Sanity + orderable products (real DB ids/stock) from
   the Shop API, both server-side → ShopGrid lines them up by slug to enable real Add-to-cart. */

export default async function ShopPreview() {
  const [products, orderable] = await Promise.all([getDeviceTypes(), getShopProducts()]);
  return (
    <SiteShell>
      <Section
        eyebrow="Shop"
        title="GPS trackers for every ride"
        subtitle="Cash on delivery across Pakistan — every device includes a 1-year subscription."
      >
        <ShopGrid products={products} orderable={orderable} />
      </Section>
    </SiteShell>
  );
}
