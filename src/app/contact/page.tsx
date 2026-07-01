import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/tad/site-shell';
import { Blocks } from '@/components/tad/blocks';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';
import { getPage } from '@/lib/pages';

const CONTACT_SLUG = 'contact';

const METHODS: [string, string, string][] = [
  ['Call us', '+92 21 111 823 725', 'Mon–Sat, 9am–8pm PKT'],
  ['Email', 'help@track-any-device.com', 'We reply within one business day'],
  ['Help center', 'Guides, setup, and FAQs', '/support'],
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(CONTACT_SLUG);
  return {
    title: page?.metaTitle ?? undefined, // falls back to the root layout's default title
    description:
      page?.metaDescription ??
      'Questions about a device, an order, or your account? Reach our team and we will get back to you quickly.',
  };
}

export default async function ContactPage() {
  const page = await getPage(CONTACT_SLUG);

  // Sanity content wins when a published 'contact' Page has sections.
  if (page?.sections?.length) {
    return (
      <SiteShell>
        <Blocks sections={page.sections} />
      </SiteShell>
    );
  }

  // Built-in default — renders until a 'contact' Page is authored + published in Sanity.
  return (
    <SiteShell>
      <Hero
        eyebrow="We are here to help"
        title="Contact TAD-PAK"
        subtitle="Questions about a device, an order, or your account? Reach our team and we will get back to you quickly."
        primaryCta={{ label: 'Go to support', href: '/support' }}
      />
      <Section eyebrow="Get in touch" title="Reach us" width="lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map(([t, v, hint]) => (
            <Card key={t} className="p-6">
              <h3 className="mb-1.5 font-[family-name:var(--font-display)] text-[17px] text-[var(--text)]">{t}</h3>
              <div className="font-[family-name:var(--font-mono)] text-sm text-[var(--text)]">{v}</div>
              {hint.startsWith('/')
                ? <Link href={hint} className="tad-foot-link mt-1 inline-block">Open support</Link>
                : <p className="mt-1 text-[13px] text-[var(--text-muted)]">{hint}</p>}
            </Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
