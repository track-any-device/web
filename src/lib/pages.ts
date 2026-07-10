import { sanityFetch } from './sanity';

/* Page-builder data access — reads an authored `page` doc (with its `sections` blocks) from Sanity
   for the given slug. Mirrors catalog.ts: on any Sanity error we log + return null (never fabricate),
   so callers fall back to their built-in default instead of rendering broken/empty. */

export type CtaLink = { label?: string; href?: string };

export type Section =
  | ({ _type: 'homeHero'; _key: string } & HomeHeroData)
  | ({ _type: 'hero'; _key: string } & HeroData)
  | ({ _type: 'fullHero'; _key: string } & FullHeroData)
  | ({ _type: 'ctaBand'; _key: string } & CtaBandData)
  | ({ _type: 'split'; _key: string } & SplitData)
  | ({ _type: 'featureGrid'; _key: string } & FeatureGridData)
  | ({ _type: 'statsBand'; _key: string } & StatsBandData)
  | ({ _type: 'productGrid'; _key: string } & ProductGridData);

export type HomeHeroData = {
  eyebrow?: string; title?: string; subtitle?: string;
  primaryCta?: CtaLink; secondaryCta?: CtaLink;
};
export type HeroData = HomeHeroData;
export type FullHeroData = HomeHeroData & {
  /** Optional second paragraph under the subtitle. */
  body?: string;
  /** Optional image beside the text (plain url string on the block). */
  imageUrl?: string;
};
export type CtaBandData = {
  title?: string; subtitle?: string; cta?: CtaLink; tone?: 'brand' | 'sand';
};
export type SplitData = {
  eyebrow?: string; title?: string; body?: string; imageUrl?: string;
  cta?: CtaLink; mediaSide?: 'left' | 'right';
};
export type FeatureItem = { icon?: string; title?: string; text?: string; href?: string };
export type FeatureGridData = {
  eyebrow?: string; title?: string; subtitle?: string;
  columns?: number; features?: FeatureItem[];
};
export type StatItem = { value?: string; label?: string };
export type StatsBandData = { title?: string; stats?: StatItem[] };
export type ProductGridData = {
  eyebrow?: string; title?: string; subtitle?: string;
  category?: 'all' | 'car' | 'bike' | 'person';
};

export type PageData = {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  sections?: Section[];
};

// Project each block's fields explicitly. `imageUrl` is a plain url string on the block.
const PAGE_QUERY = `*[_type == "page" && slug.current == $slug && active == true][0]{
  title,
  metaTitle,
  metaDescription,
  sections[]{
    _type,
    _key,
    // hero / homeHero / fullHero
    eyebrow,
    title,
    subtitle,
    primaryCta{ label, href },
    secondaryCta{ label, href },
    // ctaBand / split / fullHero
    body,
    imageUrl,
    tone,
    mediaSide,
    cta{ label, href },
    // featureGrid
    columns,
    features[]{ icon, title, text, href },
    // statsBand
    stats[]{ value, label },
    // productGrid
    category
  }
}`;

export async function getPage(slug: string): Promise<PageData | null> {
  try {
    const page = await sanityFetch<PageData | null>(PAGE_QUERY, { slug });
    return page ?? null;
  } catch (err) {
    // No fabricated fallback — log and return null so the caller renders its built-in default.
    console.error(`[pages] getPage(${slug}) — Sanity read failed:`, err);
    return null;
  }
}
