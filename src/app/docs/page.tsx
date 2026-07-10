import type { Metadata } from 'next';
import Link from 'next/link';
import DocCard from '@/components/docs/DocCard';
import type { DocCardProps, IconName } from '@/components/docs/DocCard';
import { getDocNav, type DocNavItem } from '@/lib/docs-sanity';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Documentation | Track Any Device' };

const SECTION_TITLES: Record<string, string> = {
    users: 'For users',
    business: 'For business',
};
const SECTION_ORDER = ['users', 'business'];

/* Presentation defaults per doc. The body/title/summary come from Sanity;
   the card's icon / tone / audience label are presentation chosen here, keyed
   by the doc's group (for clusters) or slug (for standalone pages). */
type Card = { icon: IconName; tone: DocCardProps['tone']; audience: string; badge?: string };
const CARD_BY_KEY: Record<string, Card> = {
    'tad101':       { icon: 'Cpu',      tone: 'success', audience: 'Hardware & mobile developers', badge: 'v1.0' },
    'user-manual':  { icon: 'BookOpen', tone: 'primary', audience: 'End users' },
    'forwarding':   { icon: 'Code',     tone: 'accent',  audience: 'Integration developers' },
    'mqtt':         { icon: 'Radio',    tone: 'accent',  audience: 'Business integration teams' },
    'rest-api':     { icon: 'Network',  tone: 'accent',  audience: 'Business integration teams' },
};
const DEFAULT_CARD: Card = { icon: 'BookOpen', tone: 'primary', audience: 'Documentation' };

/** Reduce the flat nav to the cards shown on the index: one card per standalone
    page + one card per group (its lowest-order page, i.e. the cluster overview). */
function indexEntries(nav: DocNavItem[]): { section: string; doc: DocNavItem }[] {
    const seenGroups = new Set<string>();
    const out: { section: string; doc: DocNavItem }[] = [];
    for (const doc of nav) {
        if (doc.group) {
            if (seenGroups.has(doc.group)) continue; // first (lowest order) = overview
            seenGroups.add(doc.group);
        }
        out.push({ section: doc.section, doc });
    }
    return out;
}

export default async function DocsIndex() {
    const nav = await getDocNav();
    const entries = indexEntries(nav);

    const sections = SECTION_ORDER
        .map((section) => ({
            section,
            title: SECTION_TITLES[section] ?? section,
            cards: entries
                .filter((e) => e.section === section)
                .map(({ doc }): DocCardProps => {
                    const card = CARD_BY_KEY[doc.group ?? doc.slug] ?? DEFAULT_CARD;
                    return {
                        title:       doc.title,
                        description: doc.summary ?? '',
                        href:        `/docs/${doc.slug}`,
                        audience:    card.audience,
                        icon:        card.icon,
                        tone:        card.tone,
                        badge:       card.badge,
                    };
                }),
        }))
        .filter((s) => s.cards.length > 0);

    return (
        <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
            <header className="mb-14 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Documentation</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Everything you need.</h1>
                <p className="mt-4 text-base text-muted-foreground">
                    The User Manual covers day-to-day tracking. TAD101 is the developer protocol for building on the platform, while MQTT and REST API forwarding get real-time device updates into your own systems. Pick the one that matches what you&apos;re trying to do.
                </p>
            </header>

            {sections.map((s) => (
                <section key={s.section} className="mb-14">
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.title}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {s.cards.map((c) => <DocCard key={c.href} {...c} />)}
                    </div>
                </section>
            ))}

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
