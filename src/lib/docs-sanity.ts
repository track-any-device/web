/* Docs content source — Sanity `docPage` documents.
   Reads happen server-side via the shared `sanityFetch` client (public dataset,
   apicdn-cached + Next revalidate). The frontend keeps its stable /docs routes;
   only the content body now comes from Sanity. */

import type { PortableTextBlock } from '@portabletext/types';
import { sanityFetch } from './sanity';

/** A single Sanity docPage, fully resolved for rendering. */
export interface DocPage {
  title: string;
  slug: string;
  section: 'users' | 'business' | string;
  group: string | null;
  order: number;
  summary: string | null;
  body: PortableTextBlock[];
}

/** Lightweight nav entry — drives the /docs index and the TAD101 sidebar. */
export interface DocNavItem {
  title: string;
  slug: string;
  section: 'users' | 'business' | string;
  group: string | null;
  order: number;
  summary: string | null;
}

const DOC_PAGE_PROJECTION = `{
  title,
  "slug": slug.current,
  section,
  group,
  order,
  summary,
  body[]{
    ...,
    _type == "docTable" => {
      ...,
      rows[]{ ..., cells }
    }
  }
}`;

const DOC_NAV_PROJECTION = `{
  title,
  "slug": slug.current,
  section,
  group,
  order,
  summary
}`;

/** Fetch one docPage by its stable slug (matches the route). */
export async function getDocPage(slug: string): Promise<DocPage | null> {
  const query = `*[_type == "docPage" && slug.current == $slug][0]${DOC_PAGE_PROJECTION}`;
  const doc = await sanityFetch<DocPage | null>(query, { slug });
  return doc ?? null;
}

/** Fetch the full docs nav (titles/slugs/section/group/order) for the index +
    TAD101 sidebar, ordered by section then order. */
export async function getDocNav(): Promise<DocNavItem[]> {
  const query = `*[_type == "docPage"] | order(section asc, order asc)${DOC_NAV_PROJECTION}`;
  const nav = await sanityFetch<DocNavItem[] | null>(query);
  return nav ?? [];
}

/** Convenience: nav entries for a single group (e.g. the TAD101 sidebar). */
export async function getDocGroupNav(group: string): Promise<DocNavItem[]> {
  return (await getDocNav()).filter((d) => d.group === group);
}
