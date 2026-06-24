import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Bug, BookOpen, FileText, ArrowRight } from 'lucide-react';
import { Hero, Section } from '@/components/tad/marketing';
import { Card, Badge } from '@/components/ui';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Support' };

const DOCS = [
  { title: 'User Manual',       href: '/docs/user-manual',    description: 'Getting started with your TAD devices and the my portal.' },
  { title: 'TAD101 Protocol',   href: '/docs/tad101',         description: 'Universal device communication protocol documentation.' },
  { title: 'Tenant Manual',     href: '/docs/tenant-manual',  description: 'Managing fleets, beats, and incidents as an organization.' },
  { title: 'Tenant API',        href: '/docs/tenant-api',     description: 'REST API reference for tenant integrations.' },
  { title: 'JT808 Protocol',    href: '/docs/jt808',          description: 'JT/T 808 protocol support for compatible devices.' },
  { title: 'Engineers Manual',  href: '/docs/engineers-manual', description: 'Deep-dive technical reference for hardware engineers.' },
];

const CONTACT_METHODS = [
  {
    icon: Mail,
    label: 'Email Support',
    value: 'support@track-any-device.com',
    href: 'mailto:support@track-any-device.com',
    description: 'General enquiries, billing, and account issues. Response within 24 hours.',
  },
  {
    icon: Bug,
    label: 'Bug Reports',
    value: 'GitHub Issues',
    href: 'https://github.com/track-any-device',
    description: 'Found a bug? Open an issue on our GitHub organisation.',
  },
  {
    icon: BookOpen,
    label: 'Documentation',
    value: 'docs.track-any-device.com',
    href: '/docs',
    description: 'Browse the full platform documentation.',
  },
];

export default function SupportPage() {
  return (
    <>
      <Hero
        eyebrow="Help & Support"
        title="Support"
        subtitle="Need help with your devices, account, or integration? We're here for you."
        primaryCta={{ label: 'Browse docs', href: '/docs' }}
      />

      {/* Contact methods */}
      <Section eyebrow="Get in touch" title="Contact us" width="lg">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONTACT_METHODS.map((m) => {
            const Icon = m.icon;
            const external = m.href.startsWith('http');
            return (
              <a
                key={m.label}
                href={m.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="group block"
              >
                <Card interactive raised className="h-full p-6">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-subtle)] text-[var(--brand-on-subtle)]">
                    <Icon size={20} strokeWidth={2} aria-hidden />
                  </span>
                  <p className="font-semibold text-[var(--text)]">{m.label}</p>
                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--brand)]">{m.value}</p>
                  <p className="mt-2 text-[length:var(--text-sm)] leading-normal text-[var(--text-secondary)]">{m.description}</p>
                </Card>
              </a>
            );
          })}
        </div>
      </Section>

      {/* Documentation */}
      <Section eyebrow="Reference" title="Documentation" width="lg" className="pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DOCS.map((doc) => (
            <Link key={doc.href} href={doc.href} className="group block">
              <Card interactive className="flex h-full flex-row items-start gap-4 p-5">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-subtle)] text-[var(--brand-on-subtle)]">
                  <FileText size={16} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text)]">{doc.title}</p>
                  <p className="mt-0.5 text-[length:var(--text-sm)] leading-normal text-[var(--text-secondary)]">{doc.description}</p>
                </div>
                <ArrowRight size={16} strokeWidth={2} className="ml-auto mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Status */}
      <Section width="lg" className="pt-0">
        <Card raised className="p-6">
          <div className="flex items-center gap-4">
            <Badge variant="success" dot>Operational</Badge>
            <div>
              <p className="font-semibold text-[var(--text)]">All systems operational</p>
              <p className="mt-0.5 text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                Platform, API, and real-time services are running normally.
              </p>
            </div>
          </div>
        </Card>
      </Section>
    </>
  );
}
