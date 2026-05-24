import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Compute Boards' };

const QUERY = gql`
  query ComputeBoards {
    computeBoards { id name manufacturer mcu flash_kb ram_kb operating_voltage datasheet_url notes }
  }
`;

interface Board { id: string; name: string; manufacturer: string; mcu: string; flash_kb: number; ram_kb: number; operating_voltage: number; datasheet_url: string; notes: string; }

export default async function ComponentsPage() {
  let items: Board[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.computeBoards ?? [];
  } catch {}

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Compute Boards</h1>
      <p className="text-gray-500 mb-8">Arduino, Raspberry Pi, ESP32, and other boards compatible with TAD101.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(b => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
            <h2 className="font-semibold text-gray-900 mb-1">{b.name}</h2>
            {b.manufacturer && <p className="text-sm text-gray-500 mb-3">by {b.manufacturer}</p>}

            <dl className="text-xs space-y-1.5">
              {b.mcu && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">MCU</dt>
                  <dd className="font-mono text-gray-700">{b.mcu}</dd>
                </div>
              )}
              {b.flash_kb != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Flash</dt>
                  <dd className="text-gray-700">{b.flash_kb} KB</dd>
                </div>
              )}
              {b.ram_kb != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">RAM</dt>
                  <dd className="text-gray-700">{b.ram_kb} KB</dd>
                </div>
              )}
              {b.operating_voltage != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Voltage</dt>
                  <dd className="text-gray-700">{b.operating_voltage} V</dd>
                </div>
              )}
            </dl>

            {b.notes && <p className="text-xs text-gray-400 mt-3 line-clamp-2">{b.notes}</p>}
            {b.datasheet_url && (
              <a href={b.datasheet_url} target="_blank" rel="noopener"
                className="inline-block mt-3 text-xs text-blue-600 hover:underline font-medium">
                View Datasheet →
              </a>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-20">No compute boards in catalog yet.</p>
      )}
    </>
  );
}
