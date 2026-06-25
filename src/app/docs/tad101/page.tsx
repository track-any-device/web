import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocPage } from '@/lib/docs-sanity';
import { DocBody } from '@/components/docs/DocBody';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Overview – TAD101 | Track Any Device' };

export default async function OverviewPage() {
    const doc = await getDocPage('tad101');
    if (!doc) notFound();
    return <DocBody value={doc.body} />;
}
