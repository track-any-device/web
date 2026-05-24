import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Products' };

const QUERY = gql`
  query Products {
    deviceTypes {
      id name slug description price_usd price_pkr is_featured
    }
  }
`;

interface DeviceType { id: string; name: string; slug: string; description: string; price_usd: number; price_pkr: number; is_featured: boolean; }

export default async function ProductsPage() {
  let items: DeviceType[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.deviceTypes ?? [];
  } catch {}

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
      <p className="text-gray-500 mb-8">GPS trackers, IoT devices, and custom hardware builds.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(p => (
          <a key={p.id} href={`/products/${p.slug}`}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition group">
            <div className="h-44 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center text-5xl relative">
              📡
              {p.is_featured && (
                <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Featured</span>
              )}
            </div>
            <div className="p-5">
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-base">{p.name}</h2>
              {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                {p.price_usd != null && <span className="text-blue-600 font-semibold text-sm">${p.price_usd}</span>}
                {p.price_pkr != null && <span className="text-gray-400 text-xs">PKR {p.price_pkr.toLocaleString()}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-20">No products yet.</p>
      )}
    </>
  );
}
