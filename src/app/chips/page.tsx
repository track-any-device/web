import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Chips' };

const QUERY = gql`
  query Chips {
    chips { id name manufacturer type datasheet_url specifications notes }
  }
`;

interface Chip { id: string; name: string; manufacturer: string; type: string; datasheet_url: string; specifications: string; notes: string; }

export default async function ChipsPage() {
  let items: Chip[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.chips ?? [];
  } catch {}

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Chips</h1>
      <p className="text-gray-500 mb-8">Microchips and integrated circuits used across our hardware catalog.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{c.name}</h2>
              {c.type && (
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">
                  {c.type}
                </span>
              )}
            </div>
            {c.manufacturer && <p className="text-sm text-gray-500">By {c.manufacturer}</p>}
            {c.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.notes}</p>}
            {c.datasheet_url && (
              <a href={c.datasheet_url} target="_blank" rel="noopener"
                className="inline-block mt-3 text-xs text-blue-600 hover:underline font-medium">
                View Datasheet →
              </a>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-20">No chips in catalog yet.</p>
      )}
    </>
  );
}
