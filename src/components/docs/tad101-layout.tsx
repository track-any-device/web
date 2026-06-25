'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ArrowLeft, ArrowRight,
    BookOpen, Box, Network, Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

/** A TAD101 sidebar entry, derived from a Sanity docPage in group "tad101". */
export type Tad101Section = { slug: string; title: string; href: string };

export const TAD101_VERSION = '1.0.0';

/* Per-slug sidebar icon (presentation only; titles/order come from Sanity). */
const ICON_BY_SLUG: Record<string, LucideIcon> = {
    'tad101':              BookOpen,
    'tad101-architecture': Network,
    'tad101-envelope':     Box,
    'tad101-sensors':      Wifi,
};

/** Map a tad101 docPage slug to its kept route. */
export function tad101Href(slug: string): string {
    if (slug === 'tad101') return '/docs/tad101';
    return `/docs/tad101/${slug.replace(/^tad101-/, '')}`;
}

export function Tad101Shell({
    sections,
    children,
}: {
    sections: Tad101Section[];
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const activeIdx = sections.findIndex(
        (s) => s.href === pathname || (s.href !== '/docs/tad101' && pathname.startsWith(s.href)),
    );
    const active = sections[activeIdx] ?? sections[0];
    const pageTitle = active?.title ?? 'TAD101';
    const prev = activeIdx > 0 ? sections[activeIdx - 1] : null;
    const next = activeIdx >= 0 && activeIdx < sections.length - 1 ? sections[activeIdx + 1] : null;

    return (
        <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-10 lg:gap-10 lg:px-8">
            {/* Sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">TAD101</p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
                            v{TAD101_VERSION}
                        </span>
                    </div>
                    <nav className="space-y-0.5">
                        {sections.map((s) => {
                            const Icon = ICON_BY_SLUG[s.slug] ?? BookOpen;
                            const isActive = s.slug === active?.slug;
                            return (
                                <Link
                                    key={s.slug}
                                    href={s.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                        isActive
                                            ? 'bg-primary/10 font-semibold text-primary'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )}
                                >
                                    <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/70')} />
                                    <span>{s.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Content */}
            <main className="min-w-0 flex-1">
                <header className="mb-8">
                    <p className="text-xs font-semibold tracking-widest text-primary uppercase">TAD101 universal protocol</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{pageTitle}</h1>
                </header>

                <article className={cn(
                    'prose max-w-none prose-neutral dark:prose-invert',
                    'prose-headings:font-semibold prose-headings:tracking-tight',
                    'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
                    'prose-strong:text-foreground',
                    'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.875em] prose-code:font-medium prose-code:text-foreground prose-code:before:hidden prose-code:after:hidden',
                    'prose-table:my-4 prose-table:text-sm',
                    'prose-th:border-b prose-th:border-border prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-th:text-left',
                    'prose-td:border-b prose-td:border-border prose-td:px-3 prose-td:py-2',
                )}>
                    {children}
                </article>

                {(prev || next) && (
                    <nav className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6">
                        <div>
                            {prev && (
                                <Link href={prev.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                                    <ArrowLeft className="size-4" />
                                    <span className="flex flex-col items-start">
                                        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Previous</span>
                                        <span>{prev.title}</span>
                                    </span>
                                </Link>
                            )}
                        </div>
                        <div>
                            {next && (
                                <Link href={next.href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent">
                                    <span className="flex flex-col items-end">
                                        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Next</span>
                                        <span>{next.title}</span>
                                    </span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            )}
                        </div>
                    </nav>
                )}
            </main>
        </div>
    );
}
