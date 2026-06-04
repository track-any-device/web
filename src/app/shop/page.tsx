import { makeServerClient } from '@/lib/apollo';
import { getSession } from '@/lib/auth';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Shop' };

const QUERY = gql`
  query Shop {
    deviceTypes { id name slug description price_usd price_pkr is_featured }
    accessories { id name slug description price_usd price_pkr image_url in_stock }
  }
`;

interface DeviceType {
  id: string; name: string; slug: string; description: string;
  price_usd: number; price_pkr: number; is_featured: boolean;
}

interface Accessory {
  id: string; name: string; slug: string; description: string;
  price_usd: number; price_pkr: number; image_url: string | null; in_stock: boolean;
}

export default async function ShopPage() {
  const session = await getSession();

  let devices: DeviceType[]    = [];
  let accessories: Accessory[] = [];

  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    devices     = data.deviceTypes  ?? [];
    accessories = data.accessories  ?? [];
  } catch {}

  return (
    <div className="max-w-7xl mx-auto px-6 py-14 space-y-16">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3b82f6' }}>Store</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Shop</h1>
        <p className="text-lg max-w-2xl" style={{ color: '#64748b' }}>
          GPS trackers, IoT devices, and accessories. All hardware ships ready to connect to the TAD platform.
        </p>
      </div>

      {/* Devices */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#60a5fa' }}>Tracking Hardware</p>
            <h2 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Devices</h2>
          </div>
        </div>

        {devices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {devices.map(d => (
              <a key={d.id} href={`/products/${d.slug}`}
                className="card-hover glass rounded-2xl overflow-hidden block group">
                <div className="h-44 flex items-center justify-center text-5xl relative"
                  style={{ background: 'linear-gradient(135deg,rgba(30,58,92,0.7),rgba(12,42,74,0.7))' }}>
                  📡
                  {d.is_featured && (
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)', color: '#fff' }}>
                      Featured
                    </span>
                  )}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(59,130,246,0.08)' }} />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-sm transition-colors group-hover:text-blue-400 mb-1"
                    style={{ color: '#e2e8f0' }}>{d.name}</h3>
                  {d.description && (
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: '#64748b' }}>{d.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {d.price_usd != null && (
                        <span className="font-bold gradient-text">${d.price_usd}</span>
                      )}
                      {d.price_pkr != null && (
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>
                          PKR {d.price_pkr.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {session && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                        In Stock
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📡</p>
            <p style={{ color: '#475569' }}>No devices in catalog yet.</p>
          </div>
        )}
      </section>

      {/* Accessories */}
      <section id="accessories">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#a78bfa' }}>Add-ons</p>
            <h2 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Accessories</h2>
          </div>
        </div>

        {accessories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {accessories.map(a => (
              <div key={a.id} className="card-hover glass rounded-2xl overflow-hidden">
                <div className="h-36 flex items-center justify-center text-4xl relative"
                  style={{ background: 'linear-gradient(135deg,rgba(88,28,135,0.4),rgba(49,46,129,0.4))' }}>
                  {a.image_url
                    ? <img src={a.image_url} alt={a.name} className="h-full w-full object-contain p-4" />
                    : '🔌'}
                  {!a.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#e2e8f0' }}>{a.name}</h3>
                  {a.description && (
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: '#64748b' }}>{a.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {a.price_usd != null && (
                      <span className="font-bold gradient-text">${a.price_usd}</span>
                    )}
                    {a.price_pkr != null && (
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>
                        PKR {a.price_pkr.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl"
            style={{ background: 'rgba(15,23,42,0.3)', border: '1px dashed rgba(51,65,85,0.5)' }}>
            <p className="text-3xl mb-3">🔌</p>
            <p style={{ color: '#475569' }}>No accessories in catalog yet.</p>
          </div>
        )}
      </section>

      {/* CTA for unauthenticated users */}
      {!session && (
        <section className="rounded-2xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(30,58,138,0.4),rgba(12,74,110,0.4))', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Ready to order?</h2>
          <p className="mb-6 max-w-md mx-auto" style={{ color: '#64748b' }}>
            Sign in to check real-time stock, place an order, and track your devices in the TAD platform.
          </p>
          <a href="/api/auth/login"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm text-white glow-blue"
            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
            Get Started
          </a>
        </section>
      )}
    </div>
  );
}
