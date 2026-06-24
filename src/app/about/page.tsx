import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';

const POINTS: [string, string][] = [
  ['Pakistan-first', 'Built for local realities — PKR pricing, cash on delivery, SMS-OTP sign-in, and friendly support.'],
  ['GPS you can trust', 'Real-time location for cars, bikes, and people, with instant move and tamper alerts.'],
  ['Simple and fair', 'Buy a tracker, fit it, and track from your phone or the web — no contracts, no jargon.'],
];

export default function AboutPage() {
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
