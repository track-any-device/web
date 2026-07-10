import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, BookOpen, Cpu, Network, Radio, ArrowRight } from 'lucide-react';
import { Blocks } from '@/components/tad/blocks';
import { Hero, Section } from '@/components/tad/marketing';
import { Card } from '@/components/ui';
import { getPage } from '@/lib/pages';

export const runtime = 'edge';

const SUPPORT_SLUG = 'support';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(SUPPORT_SLUG);
  return {
    title: page?.metaTitle ?? 'Support',
    description: page?.metaDescription ?? undefined,
  };
}

const CONTACT_METHODS = [
  {
    icon: Phone,
    label: 'Call us',
    value: '+92 21 111 823 725',
    href: 'tel:+922111823725',
    description: 'Mon–Sat, 9am–8pm PKT. Talk to our team about devices, orders, or your account.',
  },
  {
    icon: Mail,
    label: 'Email us',
    value: 'help@track-any-device.com',
    href: 'mailto:help@track-any-device.com',
    description: 'General enquiries, billing, and account issues. We reply within one business day.',
  },
];

export default async function SupportPage() {
  const page = await getPage(SUPPORT_SLUG);

  // Sanity content wins when a published 'support' Page has sections.
  // SiteShell is supplied by support/layout.tsx, so render Blocks directly here.
  if (page?.sections?.length) {
    return <Blocks sections={page.sections} />;
  }

  // Built-in default — renders until a 'support' Page is authored + published in Sanity.
  return (
    <>
      <Hero
        eyebrow="Help & Support"
        title="Support"
        subtitle="Whether you're tracking your own devices or building on the platform, here's where to start."
        primaryCta={{ label: 'Read the User Manual', href: '/docs/user-manual' }}
      />

      {/* ── For Users ── */}
      <Section eyebrow="For users" title="Using your devices" width="lg">
        <p className="mb-6 max-w-2xl text-[length:var(--text-base)] leading-normal text-[var(--text-secondary)]">
          New to Track Any Device, or just need a refresher? The User Manual walks you through
          signing in, adding a device, live tracking, incidents, and the mobile app. If you&apos;d
          rather talk to someone, reach our team directly.
        </p>

        <Link href="/docs/user-manual" className="group block">
          <Card interactive raised className="mb-6 flex flex-row items-start gap-4 p-6">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-subtle)] text-[var(--brand-on-subtle)]">
              <BookOpen size={20} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--text)]">User Manual</p>
              <p className="mt-0.5 text-[length:var(--text-sm)] leading-normal text-[var(--text-secondary)]">
                Getting started with your TAD devices, the my portal, and the mobile app.
              </p>
            </div>
            <ArrowRight size={16} strokeWidth={2} className="ml-auto mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Card>
        </Link>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CONTACT_METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <a key={m.label} href={m.href} className="group block">
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

      {/* ── For Business ── */}
      <Section eyebrow="For business" title="Build on the platform" width="lg" className="pt-0">
        <p className="mb-6 max-w-2xl text-[length:var(--text-base)] leading-normal text-[var(--text-secondary)]">
          Connecting your own hardware or integrating telemetry into your fleet? TAD101 is our universal
          device protocol, and signal forwarding delivers your devices&apos; live signals straight into
          your own systems over REST API or MQTT.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/docs/tad101" className="group block">
            <Card interactive raised className="flex h-full flex-row items-start gap-4 p-6">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-subtle)] text-[var(--brand-on-subtle)]">
                <Cpu size={20} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text)]">TAD101 Protocol</p>
                <p className="mt-0.5 text-[length:var(--text-sm)] leading-normal text-[var(--text-secondary)]">
                  Universal device communication protocol for real-time telemetry and remote commands.
                </p>
              </div>
              <ArrowRight size={16} strokeWidth={2} className="ml-auto mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Card>
          </Link>

          <Link href="/docs/mqtt" className="group block">
            <Card interactive raised className="flex h-full flex-row items-start gap-4 p-6">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-subtle)] text-[var(--brand-on-subtle)]">
                <Radio size={20} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text)]">MQTT Forwarding</p>
                <p className="mt-0.5 text-[length:var(--text-sm)] leading-normal text-[var(--text-secondary)]">
                  Real-time device updates delivered straight to your own MQTT broker.
                </p>
              </div>
              <ArrowRight size={16} strokeWidth={2} className="ml-auto mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Card>
          </Link>

          <Link href="/docs/rest-api" className="group block">
            <Card interactive raised className="flex h-full flex-row items-start gap-4 p-6">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-subtle)] text-[var(--brand-on-subtle)]">
                <Network size={20} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--text)]">REST API Forwarding</p>
                <p className="mt-0.5 text-[length:var(--text-sm)] leading-normal text-[var(--text-secondary)]">
                  Real-time device updates pushed to your own REST endpoint.
                </p>
              </div>
              <ArrowRight size={16} strokeWidth={2} className="ml-auto mt-0.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Card>
          </Link>
        </div>
      </Section>
    </>
  );
}
