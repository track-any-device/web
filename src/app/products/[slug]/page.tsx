import React from 'react';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/tad/site-shell';
import { Section, ProductDetail, type ProductCategory } from '@/components/tad/marketing';
import { getDeviceTypes } from '@/lib/catalog';

const FEATURES = [
  'Live location with move alerts',
  'Trip history & playback',
  'Geofence enter / exit notifications',
  'Tamper & tow-away alerts',
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const products = await getDeviceTypes();
  const p = products.find((x) => x.slug === slug);

  if (!p) {
    notFound();
  }

  return (
    <SiteShell>
      <Section width="lg">
        <ProductDetail
          name={p.name}
          category={p.category as ProductCategory}
          image={p.image}
          price={p.price}
          vendor={p.vendor}
          features={FEATURES}
        />
      </Section>
    </SiteShell>
  );
}
