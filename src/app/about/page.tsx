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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)' }}>
          {POINTS.map(([t, d]) => (
            <Card key={t} style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text)' }}>{t}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{d}</p>
            </Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
