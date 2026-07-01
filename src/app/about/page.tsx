import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/tad/site-shell';
import { Blocks } from '@/components/tad/blocks';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';
import { getPage } from '@/lib/pages';

const ABOUT_SLUG = 'about';

const POINTS: [string, string][] = [
  ['Pakistan-first', 'Built for local realities — PKR pricing, cash on delivery, SMS-OTP sign-in, and friendly support.'],
  ['GPS you can trust', 'Real-time location for cars, bikes, and people, with instant move and tamper alerts.'],
  ['Simple and fair', 'Buy a tracker, fit it, and track from your phone or the web — no contracts, no jargon.'],
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(ABOUT_SLUG);
  return {
    title: page?.metaTitle ?? undefined, // falls back to the root layout's default title
    description:
      page?.metaDescription ??
      'TAD-PAK keeps cars, bikes, and people safe across Pakistan with real-time GPS that anyone can set up.',
  };
}

export default async function AboutPage() {
  const page = await getPage(ABOUT_SLUG);

  // Sanity content wins when a published 'about' Page has sections.
  if (page?.sections?.length) {
    return (
      <SiteShell>
        <Blocks sections={page.sections} />
      </SiteShell>
    );
  }

  // Built-in default — renders until an 'about' Page is authored + published in Sanity.
  return (
    <SiteShell>
      <Hero
        eyebrow="Pakistan-first GPS tracking"
        title="About TAD-PAK"
        subtitle="TAD-PAK keeps cars, bikes, and people safe across Pakistan with real-time GPS that anyone can set up."
        primaryCta={{ label: 'Shop trackers', href: '/shop' }}
      />
      <Section eyebrow="Why TAD-PAK" title="Tracking, the friendly way" width="lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map(([t, d]) => (
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
