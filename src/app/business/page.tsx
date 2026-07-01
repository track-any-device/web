import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/tad/site-shell';
import { Blocks } from '@/components/tad/blocks';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';
import { getPage } from '@/lib/pages';

const BUSINESS_SLUG = 'business';

const FEATURES: [string, string][] = [
  ['Live fleet map', 'Every vehicle, asset, and field worker on one map — updated the moment anything moves.'],
  ['Geofences & beats', 'Draw zones and routes; get alerted on enter, exit, or off-route.'],
  ['Trips & history', 'Replay any journey with stops, speed, and distance.'],
  ['Roles & access', 'Give your team scoped access — manage drivers, assets, and alerts.'],
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(BUSINESS_SLUG);
  return {
    title: page?.metaTitle ?? undefined, // falls back to the root layout's default title
    description:
      page?.metaDescription ??
      'Live tracking, geofences, and trip history for cars, bikes, and field staff — one dashboard for your whole fleet.',
  };
}

export default async function BusinessPage() {
  const page = await getPage(BUSINESS_SLUG);

  // Sanity content wins when a published 'business' Page has sections.
  if (page?.sections?.length) {
    return (
      <SiteShell>
        <Blocks sections={page.sections} />
      </SiteShell>
    );
  }

  // Built-in default — renders until a 'business' Page is authored + published in Sanity.
  return (
    <SiteShell>
      <Hero
        eyebrow="Built for fleets and teams"
        title="TAD-PAK for business"
        subtitle="Live tracking, geofences, and trip history for cars, bikes, and field staff — one dashboard for your whole fleet."
        primaryCta={{ label: 'Talk to us', href: '/contact' }}
        secondaryCta={{ label: 'See devices', href: '/shop' }}
      />
      <Section eyebrow="Capabilities" title="Everything your operation needs" width="lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <Card key={t} className="p-6">
              <h3 className="mb-1.5 font-[family-name:var(--font-display)] text-[17px] text-[var(--text)]">{t}</h3>
              <p className="m-0 text-sm leading-normal text-[var(--text-secondary)]">{d}</p>
            </Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
