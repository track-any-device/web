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
  name, "slug": slug.current, category, vendor, protocol, "price": pricePkr, "image": imageUrl
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
