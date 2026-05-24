import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Code, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card } from '@track-any-device/components';
import { cn } from '@track-any-device/components';

export const metadata: Metadata = { title: 'Documentation | Track Any Device' };

type DocEntry = {
    title: string;
    description: string;
    href: string;
    audience: string;
    icon: LucideIcon;
    tone: 'primary' | 'info' | 'success' | 'accent';
    badge?: string;
};

const DOCS: DocEntry[] = [
    {
        title: 'User Manual',
        description:
            'Buy a device, register it to your account, set up personal beats, and monitor live tracking from the central app.',
        href: '/docs/user-manual',
        audience: 'End users (Role::User)',
        icon: BookOpen,
        tone: 'primary',
    },
    {
        title: 'Tenant Manual',
        description:
            'Run an organisation on the platform — assignees, beats, incidents, workflows, and Supervisors & Teams.',
        href: '/docs/tenant-manual',
        audience: 'Tenant operators (Role::TenantUser)',
        icon: Building2,
        tone: 'info',
    },
    {
        title: 'Tenant API Manual',
        description:
            'REST endpoints, Sanctum token scopes, and Soketi channel auth for tenants building custom UIs or backend integrations.',
        href: '/docs/tenant-api',
        audience: 'Tenant developers',
        icon: Code,
        tone: 'accent',
    },
    {
        title: 'TAD101 Protocol',
        description:
            'Universal device protocol for Android, iOS, Arduino, and Raspberry Pi. Envelope spec, channel taxonomy, SDK guides, sensors and command registry.',
        href: '/docs/tad101',
        audience: 'Hardware engineers',
        icon: Cpu,
        tone: 'success',
        badge: 'v1.0.0',
    },
];

const TONE_BG: Record<DocEntry['tone'], string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info-subtle text-info-fg',
    success: 'bg-primary/10 text-primary',
    accent: 'bg-accent text-accent-foreground',
};

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
                    {DOCS.map((d) => {
                        const Icon = d.icon;

                        return (
                            <Link
                                key={d.href}
                                href={d.href}
                                className="group block"
                            >
                                <Card className="h-full border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md">
                                    <div className="flex items-start gap-4">
                                        <span
                                            className={cn(
                                                'grid size-12 shrink-0 place-items-center rounded-xl',
                                                TONE_BG[d.tone],
                                            )}
                                        >
                                            <Icon className="size-6" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-semibold tracking-tight">
                                                    {d.title}
                                                </h2>
                                                {d.badge && (
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
                                                        {d.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                {d.audience}
                                            </p>
                                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                                {d.description}
                                            </p>
                                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                                                Read the manual
                                                <ArrowRight className="size-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
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
