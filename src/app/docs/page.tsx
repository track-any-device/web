import type { Metadata } from 'next';
import Link from 'next/link';
import DocCard from '@/components/docs/DocCard';
import type { DocCardProps } from '@/components/docs/DocCard';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Documentation | Track Any Device' };

const DOCS: DocCardProps[] = [
    {
        title:       'User Manual',
        description: 'Sign in with your phone number, add a device to your account, track it live, and monitor incidents from the Track Any Device portal and mobile app.',
        href:        '/docs/user-manual',
        audience:    'End users',
        icon:        'BookOpen',
        tone:        'primary',
    },
    {
        title:       'TAD101 Protocol',
        description: 'Connect any WebSocket-capable device to the platform for real-time telemetry and remote commands. Architecture, message envelope, and the sensor registry.',
        href:        '/docs/tad101',
        audience:    'Hardware & mobile developers',
        icon:        'Cpu',
        tone:        'success',
        badge:       'v1.0',
    },
    {
        title:       'Signal forwarding',
        description: 'Forward your devices’ location & heartbeat signals into your own systems over REST API or MQTT — payload, field mapping, and setup.',
        href:        '/docs/forwarding',
        audience:    'Integration developers',
        icon:        'Code',
        tone:        'accent',
    },
];

export default function DocsIndex() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
            <header className="mb-14 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Documentation</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Everything you need.</h1>
                <p className="mt-4 text-base text-muted-foreground">
                    The User Manual covers tracking your devices day to day. TAD101 is the protocol for connecting your own hardware to the platform. Pick the one that matches what you&apos;re trying to do.
                </p>
            </header>

            <section className="mb-14">
                <div className="grid gap-4 sm:grid-cols-2">
                    {DOCS.map(d => <DocCard key={d.href} {...d} />)}
                </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold tracking-tight">Need something not covered here?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Browse our{' '}
                    <Link href="/products" className="text-primary hover:underline">hardware catalogue</Link>,
                    visit the{' '}
                    <Link href="/support" className="text-primary hover:underline">support page</Link>,
                    or{' '}
                    <Link href="/contact" className="text-primary hover:underline">contact us</Link> directly.
                </p>
            </section>
        </main>
    );
}
