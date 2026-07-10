/* Pure, server-safe TAD101 docs-nav helpers. Kept OUT of `tad101-layout.tsx` (a `'use client'`
   module) because the tad101 docs `layout.tsx` is a Server Component and calls `tad101Href` during
   render — invoking a function exported from a client module on the server throws
   ("Attempted to call tad101Href() from the server but tad101Href is on the client"). */

/** A TAD101 sidebar entry, derived from a Sanity docPage in group "tad101". */
export type Tad101Section = { slug: string; title: string; href: string };

/** Map a tad101 docPage slug to its kept route. */
export function tad101Href(slug: string): string {
  if (slug === 'tad101') return '/docs/tad101';
  return `/docs/tad101/${slug.replace(/^tad101-/, '')}`;
}
