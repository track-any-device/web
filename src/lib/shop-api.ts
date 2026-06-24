/* Orderable-product data access — the public Shop API on `app/` (ProductController).
   This is the source of the real DB `product_id` that checkout needs; the marketing catalogue
   (Sanity / lib/products) is presentation-only and never supplies an id. Reads happen server-side
   (server components / route handlers) so we hit `app/` directly — the Next server IS the BFF. */

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

/** A normalised orderable product as the web app consumes it. `id` is the DB product id. */
export interface ShopProduct {
  id: number;
  sku: string;
  name: string;
  /** PKR, as a number (the API may return a decimal string). */
  price: number;
  currency: string;
  inStock: boolean;
  /** Best single image URL, if any. */
  image?: string;
  /** Max units per order before contact-sales is required (when the API exposes it). */
  maxOrderQuantity?: number;
}

/** Raw product shape from the API — fields are optional/loose because the contract has a few
    spellings (`price` string|number, `image` vs `images[]`, `in_stock` vs `stock`). */
interface RawProduct {
  id: number;
  sku: string;
  name: string;
  price?: number | string;
  currency?: string;
  in_stock?: boolean;
  stock?: number;
  image?: string | null;
  images?: string[] | null;
  max_order_quantity?: number;
}

function toNumber(v: number | string | undefined): number {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function firstImage(raw: RawProduct): string | undefined {
  if (raw.image) return raw.image;
  if (Array.isArray(raw.images) && raw.images.length) return raw.images[0];
  return undefined;
}

function deriveInStock(raw: RawProduct): boolean {
  if (typeof raw.in_stock === 'boolean') return raw.in_stock;
  if (typeof raw.stock === 'number') return raw.stock > 0;
  // No stock signal from the API → assume orderable rather than blocking a real product.
  return true;
}

function normalise(raw: RawProduct): ShopProduct {
  return {
    id: raw.id,
    sku: raw.sku,
    name: raw.name,
    price: toNumber(raw.price),
    currency: raw.currency || 'PKR',
    inStock: deriveInStock(raw),
    image: firstImage(raw),
    maxOrderQuantity: typeof raw.max_order_quantity === 'number' ? raw.max_order_quantity : undefined,
  };
}

/** A URL-safe slug derived from any string (matches the marketing `slug` style: lowercased,
    non-alphanumerics → single dashes). Used to line a marketing slug up with an API product. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Fetch every orderable product from the public Shop API. Returns [] on any failure — the UI
    degrades to "not available for online order" rather than fabricating a product_id. */
export async function getShopProducts(): Promise<ShopProduct[]> {
  try {
    const res = await fetch(`${API_URL}/api/shop/products`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: RawProduct[] };
    const rows = Array.isArray(json?.data) ? json.data : [];
    return rows.filter((r) => r && typeof r.id === 'number').map(normalise);
  } catch {
    return [];
  }
}

/** Resolve the orderable product for a marketing slug. The marketing slug (e.g. `concox-gt06n`)
    is matched against the API product's `sku` and `name` (both slugified). Returns null when no
    DB product backs the slug — callers must then disable ordering, never invent an id. */
export async function getShopProductBySlug(slug: string): Promise<ShopProduct | null> {
  const target = slugify(slug);
  const products = await getShopProducts();
  return (
    products.find((p) => slugify(p.sku) === target || slugify(p.name) === target) ?? null
  );
}
