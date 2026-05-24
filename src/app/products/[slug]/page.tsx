import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const QUERY = gql`
  query ProductDetail($slug: String!) {
    deviceType(slug: $slug) {
      id name slug description price_usd price_pkr
      chips { id name manufacturer type datasheet_url }
      sensors { id name label unit data_type protocol description }
      computeBoards { id name manufacturer mcu flash_kb ram_kb operating_voltage datasheet_url }
    }
  }
`;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  let product: any = null;
  try {
    const { data } = await makeServerClient().query({ query: QUERY, variables: { slug } });
    product = data.deviceType;
  } catch {}

  if (!product) notFound();

  return (
    <>
      <a href="/products" className="text-sm text-blue-600 hover:underline mb-6 inline-block">← Products</a>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="h-56 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-6xl">📡</div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.description && <p className="text-gray-500 mt-2">{product.description}</p>}
          <div className="flex gap-4 mt-4">
            {product.price_usd != null && <span className="text-2xl font-bold text-blue-600">${product.price_usd}</span>}
            {product.price_pkr != null && <span className="text-gray-400 self-end text-sm">PKR {product.price_pkr?.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chips */}
        {product.chips?.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Chips</h2>
            <ul className="space-y-3">
              {product.chips.map((c: any) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.manufacturer && <p className="text-gray-400">{c.manufacturer} · {c.type}</p>}
                  {c.datasheet_url && <a href={c.datasheet_url} className="text-blue-500 text-xs hover:underline" target="_blank">Datasheet</a>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Compute boards */}
        {product.computeBoards?.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Compute Boards</h2>
            <ul className="space-y-3">
              {product.computeBoards.map((b: any) => (
                <li key={b.id} className="text-sm">
                  <p className="font-medium text-gray-900">{b.name}</p>
                  <p className="text-gray-400">{b.mcu} · {b.flash_kb}KB flash · {b.ram_kb}KB RAM</p>
                  {b.operating_voltage && <p className="text-gray-400">{b.operating_voltage}V</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sensors */}
        {product.sensors?.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Sensors</h2>
            <ul className="space-y-3">
              {product.sensors.map((s: any) => (
                <li key={s.id} className="text-sm">
                  <p className="font-medium text-gray-900">{s.label ?? s.name}</p>
                  {s.unit && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">{s.unit}</span>}
                  {s.protocol && <p className="text-gray-400 mt-0.5">{s.protocol}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
