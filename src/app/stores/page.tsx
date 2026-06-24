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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CITIES.map((c) => (
            <Card key={c} className="p-5 font-semibold text-[var(--text)]">{c}</Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
