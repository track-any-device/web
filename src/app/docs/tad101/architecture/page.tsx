import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocPage } from '@/lib/docs-sanity';
import { DocBody } from '@/components/docs/DocBody';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Architecture – TAD101 | Track Any Device' };

export default async function ArchitecturePage() {
    const doc = await getDocPage('tad101-architecture');
    if (!doc) notFound();
    return <DocBody value={doc.body} />;
}
