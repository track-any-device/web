import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sensors' };

const QUERY = gql`
  query Sensors {
    sensors { id name label slug unit data_type protocol description icon }
  }
`;

interface Sensor { id: string; name: string; label: string; slug: string; unit: string; data_type: string; protocol: string; description: string; icon: string; }

export default async function SensorsPage() {
  let items: Sensor[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.sensors ?? [];
  } catch {}

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Sensors</h1>
      <p className="text-gray-500 mb-8">All sensor types supported by the TAD101 universal protocol.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{s.icon ?? '🔌'}</span>
              <h2 className="font-semibold text-gray-900 text-sm">{s.label ?? s.name}</h2>
            </div>
            {s.unit && (
              <span className="inline-block font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2">{s.unit}</span>
            )}
            <div className="text-xs text-gray-400 space-y-0.5">
              {s.data_type && <p>Type: <span className="text-gray-600">{s.data_type}</span></p>}
              {s.protocol && <p>Protocol: <span className="text-gray-600">{s.protocol}</span></p>}
            </div>
            {s.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{s.description}</p>}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-20">No sensors in catalog yet.</p>
      )}
    </>
  );
}
