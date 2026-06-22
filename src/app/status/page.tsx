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
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {COMPONENTS.map((c, i) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ color: 'var(--text)' }}>{c}</span>
              <Badge variant="success" dot>Operational</Badge>
            </div>
          ))}
        </Card>
      </Section>
    </SiteShell>
  );
}
