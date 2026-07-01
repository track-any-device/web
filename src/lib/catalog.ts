import { sanityFetch } from './sanity';
import { type Product } from '@/lib/products';

/* Catalog data access — reads the DeviceType catalog from Sanity (server-side). There is NO
   placeholder fallback: if Sanity has no products (or is unreachable) this returns [], so surfaces
   render a real empty state rather than fabricated data. Publish `deviceType` docs in Sanity Studio
   to populate the catalogue. */

type SanityDeviceType = {
  name: string; slug: string; category: string;
  vendor?: string; protocol?: string; price?: number; image?: string;
};

const DEVICE_TYPES_QUERY = `*[_type == "deviceType" && active == true]|order(sortOrder){
  name, "slug": slug.current, category, vendor, protocol, "price": pricePkr,
  "image": coalesce(imageUrl, image.asset->url)
}`;

export async function getDeviceTypes(): Promise<Product[]> {
  try {
    const rows = await sanityFetch<SanityDeviceType[]>(DEVICE_TYPES_QUERY);
    return (rows ?? []).map((r) => ({
      name: r.name,
      slug: r.slug,
      category: r.category as Product['category'],
      vendor: r.vendor,
      protocol: r.protocol as Product['protocol'],
      price: r.price,
      image: r.image,
    }));
  } catch (err) {
    // No fabricated fallback — surface the failure in logs and return empty so the UI shows an
    // honest empty state.
    console.error('[catalog] getDeviceTypes — Sanity read failed:', err);
    return [];
  }
}

// Single device type + its gallery images / features, for the product detail page.
type SanityDeviceTypeDetail = SanityDeviceType & {
  images?: (string | null)[];
  features?: string[];
  typeApproved?: boolean;
};

const DEVICE_TYPE_QUERY = `*[_type == "deviceType" && slug.current == $slug && active == true][0]{
  name, "slug": slug.current, category, vendor, protocol, "price": pricePkr,
  "image": coalesce(imageUrl, image.asset->url),
  "images": images[].asset->url,
  features, typeApproved
}`;

export async function getDeviceType(slug: string): Promise<Product | null> {
  try {
    const row = await sanityFetch<SanityDeviceTypeDetail | null>(DEVICE_TYPE_QUERY, { slug });
    if (!row) return null;
    return {
      name: row.name,
      slug: row.slug,
      category: row.category as Product['category'],
      vendor: row.vendor,
      protocol: row.protocol as Product['protocol'],
      price: row.price,
      image: row.image,
      images: (row.images ?? []).filter((x): x is string => !!x),
      features: row.features ?? [],
      typeApproved: row.typeApproved,
    };
  } catch (err) {
    console.error('[catalog] getDeviceType — Sanity read failed:', err);
    return null;
  }
}
