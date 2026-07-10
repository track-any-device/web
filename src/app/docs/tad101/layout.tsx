import type { Metadata } from 'next';
import { getDocGroupNav } from '@/lib/docs-sanity';
import { Tad101Shell } from '@/components/docs/tad101-layout';
import { tad101Href, type Tad101Section } from '@/components/docs/tad101-nav';

export const metadata: Metadata = {
    title: { template: '%s – TAD101 | Track Any Device', default: 'TAD101 Docs | Track Any Device' },
    description: 'TAD101 universal protocol documentation — integrate any device with the Track Any Device platform.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
    const nav = await getDocGroupNav('tad101');
    const sections: Tad101Section[] = nav.map((d) => ({
        slug: d.slug,
        title: d.title,
        href: tad101Href(d.slug),
    }));
    return <Tad101Shell sections={sections}>{children}</Tad101Shell>;
}
