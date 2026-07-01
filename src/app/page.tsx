import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/tad/site-shell';
import { Blocks, HomeHero, ProductGrid } from '@/components/tad/blocks';
import { getPage } from '@/lib/pages';

/* Homepage — Sanity-first page-builder.

   The home page renders from a Sanity `page` document with slug 'home' (its `sections` blocks). To
   change the homepage, author + publish that Page in Sanity Studio; its content then wins here.

   Until such a Page exists, we render the built-in DEFAULT composition below (same block components,
   current hero copy + a ProductGrid per device category). This keeps the live homepage from going
   blank during the migration. It contains NO fabricated product data — ProductGrid reads the real
   Sanity catalogue and shows an empty state when the catalogue is empty. */

const HOME_SLUG = 'home';

export async function generateMetadata(): Promise<Metadata> {
  const home = await getPage(HOME_SLUG);
  return {
    title: home?.metaTitle ?? undefined, // falls back to the root layout's default title
    description:
      home?.metaDescription ??
      'Real-time GPS tracking for cars, bikes, and people across Pakistan.',
  };
}

export default async function TadHome() {
  const home = await getPage(HOME_SLUG);

  // Sanity content wins when a published 'home' Page has sections.
  if (home?.sections?.length) {
    return (
      <SiteShell>
        <Blocks sections={home.sections} />
      </SiteShell>
    );
  }

  // Built-in default — renders ONLY until a 'home' Page is authored + published in Sanity.
  return (
    <SiteShell>
      <HomeHero
        eyebrow="Real-time GPS tracking · Pakistan"
        title="Always know where everything is."
        subtitle="Friendly, reliable GPS tracking for your car, bike, and team — get a ping the moment anything moves."
        primaryCta={{ label: 'Start tracking', href: '/shop' }}
        secondaryCta={{ label: 'Explore for business', href: '/business' }}
      />
      <ProductGrid
        eyebrow="For you"
        title="Track your car"
        subtitle="Live location, trips, and instant move alerts."
        category="car"
      />
      <ProductGrid
        eyebrow="For you"
        title="Track your bike"
        subtitle="Compact trackers built for two wheels."
        category="bike"
      />
      <ProductGrid
        eyebrow="For teams"
        title="Track your people"
        subtitle="Keep your field team safe with live person trackers."
        category="person"
      />
    </SiteShell>
  );
}
