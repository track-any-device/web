import React from 'react';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/tad/site-shell';
import { Section, ProductDetail, type ProductCategory } from '@/components/tad/marketing';
import { AddToCart } from '@/components/tad/add-to-cart';
import { getDeviceTypes } from '@/lib/catalog';
import { getShopProductBySlug } from '@/lib/shop-api';

const FEATURES = [
  'Live location with move alerts',
  'Trip history & playback',
  'Geofence enter / exit notifications',
  'Tamper & tow-away alerts',
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Marketing presentation comes from the catalogue (Sanity / placeholder); the orderable product
  // (real DB id, price, stock) comes from the Shop API. Both are fetched in parallel.
  const [products, orderable] = await Promise.all([getDeviceTypes(), getShopProductBySlug(slug)]);
  const p = products.find((x) => x.slug === slug);

  if (!p) {
    notFound();
  }

  // Prefer the live Shop API price/image when a DB product backs this slug; otherwise fall back to
  // the catalogue's presentation values.
  const price = orderable?.price ?? p.price;
  const image = p.image ?? orderable?.image;

  return (
    <SiteShell>
      <Section width="lg">
        <ProductDetail
          name={p.name}
          category={p.category as ProductCategory}
          image={image}
          price={price}
          vendor={p.vendor}
          features={FEATURES}
          actions={<AddToCart product={orderable} />}
        />
      </Section>
    </SiteShell>
  );
}
