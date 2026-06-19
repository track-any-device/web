import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Section, ProductDetail } from '@/components/tad/marketing';
import { PRODUCTS } from '../_products';

/* Product detail surface (PREVIEW at /tad-preview/product). Shows the first catalog item. */

const FEATURES = [
  'Live location with move alerts',
  'Trip history & playback',
  'Geofence enter / exit notifications',
  'Tamper & tow-away alerts',
];

export default function ProductDetailPreview() {
  const p = PRODUCTS[0];
  return (
    <SiteShell>
      <Section width="lg">
        <ProductDetail
          name={p.name}
          category={p.category}
          image={p.image}
          price={p.price}
          vendor={p.vendor}
          features={FEATURES}
        />
      </Section>
    </SiteShell>
  );
}
