import React from 'react';
import Link from 'next/link';
import { SiteShell } from '@/components/tad/site-shell';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';

const METHODS: [string, string, string][] = [
  ['Call us', '+92 21 111 823 725', 'Mon–Sat, 9am–8pm PKT'],
  ['Email', 'help@track-any-device.com', 'We reply within one business day'],
  ['Help center', 'Guides, setup, and FAQs', '/support'],
];

export default function ContactPage() {
  return (
    <SiteShell>
      <Hero
        eyebrow="We are here to help"
        title="Contact TAD-PAK"
        subtitle="Questions about a device, an order, or your account? Reach our team and we will get back to you quickly."
        primaryCta={{ label: 'Go to support', href: '/support' }}
      />
      <Section eyebrow="Get in touch" title="Reach us" width="lg">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-5)' }}>
          {METHODS.map(([t, v, hint]) => (
            <Card key={t} style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text)' }}>{t}</h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)' }}>{v}</div>
              {hint.startsWith('/')
                ? <Link href={hint} className="tad-foot-link" style={{ display: 'inline-block', marginTop: 4 }}>Open support</Link>
                : <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{hint}</p>}
            </Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
