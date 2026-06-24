import { sanityFetch } from './sanity';
import { PRODUCTS, type Product } from '@/lib/products';

/* Catalog data access — reads the DeviceType catalog from Sanity (server-side), with a graceful
   fallback to the local placeholder list until Sanity read access is wired (viewer token / public). */

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
    if (rows && rows.length) {
      return rows.map((r) => ({
        name: r.name,
        slug: r.slug,
        category: r.category as Product['category'],
        vendor: r.vendor,
        protocol: r.protocol as Product['protocol'],
        price: r.price,
        image: r.image,
      }));
    }
  } catch {
    // Sanity unreachable / not yet readable → fall back to placeholder.
  }
  return PRODUCTS;
}
