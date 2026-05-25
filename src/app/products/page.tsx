import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Products' };

const QUERY = gql`
  query Products {
    deviceTypes { id name slug description price_usd price_pkr is_featured }
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
    <div className="max-w-7xl mx-auto px-6 py-14">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3b82f6' }}>Hardware Catalog</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Products</h1>
        <p className="text-lg" style={{ color: '#64748b' }}>GPS trackers, IoT devices, and custom hardware builds.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(p => (
            <a key={p.id} href={`/products/${p.slug}`}
              className="card-hover glass rounded-2xl overflow-hidden block group">
              <div className="h-48 flex items-center justify-center text-6xl relative"
                style={{ background: 'linear-gradient(135deg,rgba(30,58,92,0.7),rgba(12,42,74,0.7))' }}>
                📡
                {p.is_featured && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)', color: '#fff' }}>
                    Featured
                  </span>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(59,130,246,0.08)' }} />
              </div>
              <div className="p-6">
                <h2 className="font-semibold text-base transition-colors group-hover:text-blue-400" style={{ color: '#e2e8f0' }}>{p.name}</h2>
                {p.description && <p className="text-sm mt-1.5 line-clamp-2" style={{ color: '#64748b' }}>{p.description}</p>}
                <div className="mt-4 flex items-center gap-3">
                  {p.price_usd != null && <span className="font-bold gradient-text">${p.price_usd}</span>}
                  {p.price_pkr != null && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>PKR {p.price_pkr.toLocaleString()}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="text-5xl mb-4">📡</p>
          <p className="font-medium" style={{ color: '#475569' }}>No products in catalog yet.</p>
        </div>
      )}
    </div>
  );
}
