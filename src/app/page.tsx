import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';

const HOME_QUERY = gql`
  query Home {
    featuredSolutions { id title slug description gradient_from gradient_to }
    featuredDeviceTypes { id name slug description price_usd }
  }
`;

interface Solution { id: string; title: string; slug: string; description: string; gradient_from: string; gradient_to: string; }
interface DeviceType { id: string; name: string; slug: string; description: string; price_usd: number; }

export default async function HomePage() {
  let solutions: Solution[] = [];
  let products: DeviceType[] = [];
  try {
    const { data } = await makeServerClient().query({ query: HOME_QUERY });
    solutions = data.featuredSolutions ?? [];
    products  = data.featuredDeviceTypes ?? [];
  } catch {}

  return (
    <>
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Real-time IoT Fleet Tracking</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Monitor devices, manage beats, and automate incident workflows — built for fleet, government, and IoT operators.
        </p>
        <div className="flex justify-center gap-3">
          <a href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
            Browse Products
          </a>
          <a href="/solutions" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition text-sm">
            View Solutions
          </a>
        </div>
      </section>

      {/* Featured solutions */}
      {solutions.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Solutions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {solutions.map(s => (
              <a key={s.id} href={`/solutions#${s.slug}`}
                className="block rounded-xl p-6 text-white hover:opacity-90 transition"
                style={{ background: `linear-gradient(135deg, ${s.gradient_from ?? '#3b82f6'}, ${s.gradient_to ?? '#1d4ed8'})` }}>
                <p className="font-semibold text-lg">{s.title}</p>
                {s.description && <p className="text-sm opacity-80 mt-1 line-clamp-2">{s.description}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {products.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map(p => (
              <a key={p.id} href={`/products/${p.slug}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition group">
                <div className="h-36 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-5xl">📡</div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{p.name}</p>
                  {p.price_usd != null && <p className="text-blue-600 font-medium text-sm mt-1">${p.price_usd}</p>}
                  {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-6">
            <a href="/products" className="text-blue-600 text-sm font-medium hover:underline">View all products →</a>
          </div>
        </section>
      )}
    </>
  );
}
