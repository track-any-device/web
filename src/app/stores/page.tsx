import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

export default function StoresPage() {
  return (
    <SiteShell>
      <Hero
        eyebrow="Buy in person"
        title="Find a TAD-PAK store"
        subtitle="Pick up a tracker and get it fitted at a partner store near you. The full locator is coming soon — for now, order online with cash on delivery."
        primaryCta={{ label: 'Shop online', href: '/shop' }}
      />
      <Section eyebrow="Coming soon" title="Cities we serve" width="lg">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          {CITIES.map((c) => (
            <Card key={c} style={{ padding: 'var(--space-5)', fontWeight: 600, color: 'var(--text)' }}>{c}</Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
