import type { Metadata } from 'next';
import Link from 'next/link';
import DocCard from '@/components/docs/DocCard';
import type { DocCardProps } from '@/components/docs/DocCard';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Documentation | Track Any Device' };

const DOCS: DocCardProps[] = [
    {
        title: 'User Manual',
        description: 'Buy a device, register it to your account, set up personal beats, and monitor live tracking from the central app.',
        href: '/docs/user-manual',
        audience: 'End users (Role::User)',
        icon: 'BookOpen',
        tone: 'primary',
    },
    {
        title: 'Tenant Manual',
        description: 'Run an organisation on the platform — assignees, beats, incidents, workflows, and Supervisors & Teams.',
        href: '/docs/tenant-manual',
        audience: 'Tenant operators (Role::TenantUser)',
        icon: 'Building2',
        tone: 'info',
    },
    {
        title: 'Tenant API Manual',
        description: 'REST endpoints, Sanctum token scopes, and Soketi channel auth for tenants building custom UIs or backend integrations.',
        href: '/docs/tenant-api',
        audience: 'Tenant developers',
        icon: 'Code',
        tone: 'accent',
    },
    {
        title: 'TAD101 Protocol',
        description: 'Universal device protocol for Android, iOS, Arduino, and Raspberry Pi. Envelope spec, channel taxonomy, SDK guides, sensors and command registry.',
        href: '/docs/tad101',
        audience: 'Hardware engineers',
        icon: 'Cpu',
        tone: 'success',
        badge: 'v1.0.0',
    },
];


export default function DocsIndex() {
    return (
        <>
            <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
                <header className="mb-12 max-w-2xl">
                    <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                        Documentation
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                        Everything you need to ship.
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        Manuals for end users, tenant operators, integration
                        developers, and hardware engineers. Pick the doc that
                        matches your role.
                    </p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                    {DOCS.map((d) => (
                        <DocCard key={d.href} {...d} />
                    ))}
                </div>

                <section className="mt-16 rounded-xl border border-border bg-card p-6">
                    <h2 className="text-base font-semibold tracking-tight">
                        Looking for something else?
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        The{' '}
                        <Link
                            href="/about"
                            className="text-primary hover:underline"
                        >
                            about page
                        </Link>{' '}
                        introduces the platform.{' '}
                        <Link
                            href="/products"
                            className="text-primary hover:underline"
                        >
                            Browse hardware
                        </Link>{' '}
                        to see what you can ship today, or{' '}
                        <Link
                            href="/contact"
                            className="text-primary hover:underline"
                        >
                            contact us
                        </Link>{' '}
                        if your question doesn't have a manual yet.
                    </p>
                </section>
            </main>
        </>
    );
}
