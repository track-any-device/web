import type { Metadata } from 'next';
import Link from 'next/link';
import DocCard from '@/components/docs/DocCard';
import type { DocCardProps } from '@/components/docs/DocCard';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Documentation | Track Any Device' };

const SECTION_1: DocCardProps[] = [
    {
        title:       'User Manual',
        description: 'Add a device to your account, track it live, set up personal beats, and monitor incidents from the Track Any Device portal.',
        href:        '/docs/user-manual',
        audience:    'End users',
        icon:        'BookOpen',
        tone:        'primary',
    },
    {
        title:       'Tenant Manual',
        description: 'Operate a fleet organisation — manage assignees, define patrol zones, handle incidents, and automate workflows from the tenant portal.',
        href:        '/docs/tenant-manual',
        audience:    'Tenant operators',
        icon:        'Building2',
        tone:        'info',
    },
    {
        title:       'Engineers Manual',
        description: 'Deploy the platform, configure Cloudflare Tunnel, provision tenant portals, integrate GPS hardware, and operate the stack in production.',
        href:        '/docs/engineers-manual',
        audience:    'Platform engineers & IT administrators',
        icon:        'Wrench',
        tone:        'warning',
    },
];

const SECTION_2: DocCardProps[] = [
    {
        title:       'TAD101 Protocol',
        description: 'Connect any WebSocket-capable device — Android, iOS, Arduino, Raspberry Pi — to the platform for real-time telemetry and remote commands.',
        href:        '/docs/tad101',
        audience:    'Hardware & mobile developers',
        icon:        'Cpu',
        tone:        'success',
        badge:       'v1.0',
    },
    {
        title:       'JT808 Protocol',
        description: 'Connect industry-standard JT/T 808-2019 GPS trackers via TCP. Point your device at the platform endpoint and tracking starts automatically.',
        href:        '/docs/jt808',
        audience:    'Hardware engineers & fleet operators',
        icon:        'Radio',
        tone:        'success',
    },
];

const SECTION_3: DocCardProps[] = [
    {
        title:       'My Portal API',
        description: 'Register devices, upload photos, manage notification preferences per event type, draw beats, and filter incidents — all scoped to the authenticated end user.',
        href:        '/docs/api/my',
        audience:    'App & integration developers',
        icon:        'Code',
        tone:        'accent',
    },
    {
        title:       'Tenant API',
        description: 'REST endpoints, machine API key authentication, and real-time WebSocket channels for building custom tenant integrations and dashboards.',
        href:        '/docs/tenant-api',
        audience:    'Integration developers',
        icon:        'Code',
        tone:        'accent',
    },
    {
        title:       'Shop API',
        description: 'Product catalog, Cash on Delivery checkout, order management, and device claiming via claim codes or QR scan.',
        href:        '/docs/api/shop/products',
        audience:    'App & integration developers',
        icon:        'Code',
        tone:        'accent',
    },
];

function SectionHeader({ label, title, description }: { label: string; title: string; description: string }) {
    return (
        <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{label}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

export default function DocsIndex() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
            <header className="mb-14 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Documentation</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Everything you need.</h1>
                <p className="mt-4 text-base text-muted-foreground">
                    Guides for every role — from first-time users to hardware engineers. Pick the section that matches what you're trying to do.
                </p>
            </header>

            {/* ── Section 1: Platform Manuals ── */}
            <section className="mb-14">
                <SectionHeader
                    label="Section 1"
                    title="Platform Manuals"
                    description="Step-by-step guides for users, tenant operators, and the engineers running the platform."
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SECTION_1.map(d => <DocCard key={d.href} {...d} />)}
                </div>
            </section>

            {/* ── Section 2: Device Protocols ── */}
            <section className="mb-14">
                <SectionHeader
                    label="Section 2"
                    title="Device Protocols"
                    description="Connect hardware to the platform. TAD101 covers WebSocket-based devices; JT808 covers industry GPS trackers."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    {SECTION_2.map(d => <DocCard key={d.href} {...d} />)}
                </div>
            </section>

            {/* ── Section 3: API Reference ── */}
            <section className="mb-14">
                <SectionHeader
                    label="Section 3"
                    title="API Reference"
                    description="Technical reference for developers building on top of the platform."
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SECTION_3.map(d => <DocCard key={d.href} {...d} />)}
                </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-base font-semibold tracking-tight">Need something not covered here?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Browse our{' '}
                    <Link href="/products" className="text-primary hover:underline">hardware catalogue</Link>,
                    read{' '}
                    <Link href="/solutions" className="text-primary hover:underline">solution guides</Link>,
                    or{' '}
                    <Link href="/contact" className="text-primary hover:underline">contact us</Link> directly.
                </p>
            </section>
        </main>
    );
}
