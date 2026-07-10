import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDocPage } from '@/lib/docs-sanity';
import { DocArticle } from '@/components/docs/DocArticle';
import { DocBody } from '@/components/docs/DocBody';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'REST API Forwarding | Track Any Device' };

/* For Business — receive real-time device updates on your own REST endpoint.
   Content lives in Sanity (docPage slug "rest-api"). */

const SLUG = 'rest-api';

export default async function RestApiForwardingDoc() {
  const doc = await getDocPage(SLUG);
  if (!doc) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link href="/docs" className="hover:text-primary">Docs</Link>
        <span className="mx-1.5">/</span>
        <span>{doc.title}</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">For business</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{doc.title}</h1>
        {doc.summary && (
          <p className="mt-3 text-base text-muted-foreground">{doc.summary}</p>
        )}
      </header>

      <DocArticle>
        <DocBody value={doc.body} />
      </DocArticle>
    </main>
  );
}
