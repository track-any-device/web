import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Hero, Section, ProductCard } from '@/components/tad/marketing';
import { getDeviceTypes } from '@/lib/catalog';
import type { Product } from '@/lib/products';

/* Homepage. Product data comes from the Sanity catalogue (getDeviceTypes → deviceType docs), the
   same source the /shop and /products pages use — with a placeholder fallback while the CMS catalogue
   is still being populated. Publish deviceType documents in Sanity Studio to control what shows here. */

function Grid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => <ProductCard key={p.name} {...p} />)}
    </div>
  );
}

export default async function TadHome() {
  const products = await getDeviceTypes();
  const cars = products.filter((p) => p.category === 'car');
  const bikes = products.filter((p) => p.category === 'bike');
  const people = products.filter((p) => p.category === 'person');

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
      {cars.length > 0 && (
        <Section eyebrow="For you" title="Track your car" subtitle="Live location, trips, and instant move alerts.">
          <Grid items={cars} />
        </Section>
      )}
      {bikes.length > 0 && (
        <Section eyebrow="For you" title="Track your bike" subtitle="Compact trackers built for two wheels.">
          <Grid items={bikes} />
        </Section>
      )}
      {people.length > 0 && (
        <Section eyebrow="For teams" title="Track your people" subtitle="Keep your field team safe with live person trackers.">
          <Grid items={people} />
        </Section>
      )}
    </SiteShell>
  );
}
