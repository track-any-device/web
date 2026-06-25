'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AlertTriangle, ArrowLeft, ArrowRight,
    BookOpen, Box, CheckCircle2,
    Info, Network, Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const cn = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

type SectionId =
    | 'overview' | 'architecture' | 'envelope' | 'sensors';

type SectionEntry = { id: SectionId; title: string; href: string; icon: LucideIcon };

export const TAD101_SECTIONS: SectionEntry[] = [
    { id: 'overview',          title: 'Overview',             href: '/docs/tad101',                     icon: BookOpen   },
    { id: 'architecture',      title: 'Architecture',         href: '/docs/tad101/architecture',         icon: Network    },
    { id: 'envelope',          title: 'Message envelope',     href: '/docs/tad101/envelope',             icon: Box        },
    { id: 'sensors',           title: 'Sensor registry',      href: '/docs/tad101/sensors',              icon: Wifi       },
];

export const TAD101_VERSION     = '1.0.0';
export const TAD101_LAST_UPDATE = '2026-05-23';

export function Tad101Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const activeIdx = TAD101_SECTIONS.findIndex(
        (s) => s.href === pathname || (s.href !== '/docs/tad101' && pathname.startsWith(s.href)),
    );
    const active = TAD101_SECTIONS[activeIdx] ?? TAD101_SECTIONS[0];
    const pageTitle = active.title;
    const prev = activeIdx > 0 ? TAD101_SECTIONS[activeIdx - 1] : null;
    const next = activeIdx >= 0 && activeIdx < TAD101_SECTIONS.length - 1
        ? TAD101_SECTIONS[activeIdx + 1] : null;

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
                        {TAD101_SECTIONS.map((s) => {
                            const Icon = s.icon;
                            const isActive = s.id === active.id;
                            return (
                                <Link
                                    key={s.id}
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
                    <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                        Last updated: <span className="text-foreground">{TAD101_LAST_UPDATE}</span>
                    </div>
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

/** Code block with language label + copy button. */
export function CodeBlock({ language, children }: { language?: string; children: string }) {
    return (
        <div className="not-prose my-4 overflow-hidden rounded-lg border border-border bg-muted/40">
            {language && (
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-xs text-muted-foreground">{language}</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(children)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Copy
                    </button>
                </div>
            )}
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-foreground">
                <code>{children}</code>
            </pre>
        </div>
    );
}

/** Callout box for tips, warnings and rules. */
export function Callout({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
    const cfg = {
        info:    { border: 'border-blue-200',  bg: 'bg-blue-50/40',  text: 'text-blue-700',  Icon: Info          },
        warning: { border: 'border-amber-200', bg: 'bg-amber-50/40', text: 'text-amber-700', Icon: AlertTriangle },
        success: { border: 'border-green-200', bg: 'bg-green-50/40', text: 'text-green-700', Icon: CheckCircle2  },
    }[tone];
    return (
        <div className={cn('not-prose my-4 flex gap-3 rounded-lg border px-4 py-3 text-sm dark:border-opacity-30 dark:bg-opacity-10', cfg.border, cfg.bg)}>
            <cfg.Icon className={cn('mt-0.5 size-4 shrink-0', cfg.text)} />
            <div className="text-foreground">{children}</div>
        </div>
    );
}
