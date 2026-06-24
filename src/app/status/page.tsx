import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Hero, Section } from '@/components/tad/marketing';
import { Card, Badge } from '@/components/ui';

const COMPONENTS = ['GPS ingestion', 'Mobile app', 'Website & portal', 'SMS delivery', 'Tenant API'];

export default function StatusPage() {
  return (
    <SiteShell>
      <Hero
        eyebrow="Live service status"
        title="All systems operational"
        subtitle="Tracking, the app, and the website are running normally. We post any incidents or maintenance windows here."
        primaryCta={{ label: 'Back to home', href: '/' }}
      />
      <Section eyebrow="Components" title="Current status" width="lg">
        <Card flushBody>
          {COMPONENTS.map((c, i) => (
            <div
              key={c}
              className={`flex items-center justify-between gap-3 px-5 py-3.5${i ? ' border-t border-[var(--border-subtle)]' : ''}`}
            >
              <span className="text-[var(--text)]">{c}</span>
              <Badge variant="success" dot>Operational</Badge>
            </div>
          ))}
        </Card>
      </Section>
    </SiteShell>
  );
}
