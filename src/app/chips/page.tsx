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

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  MCU:     { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa'  },
  RF:      { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80'  },
  GPS:     { bg: 'rgba(6,182,212,0.15)',   text: '#22d3ee'  },
  Memory:  { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa'  },
  Power:   { bg: 'rgba(234,179,8,0.15)',   text: '#facc15'  },
  Sensor:  { bg: 'rgba(239,68,68,0.15)',   text: '#f87171'  },
};

export default async function ChipsPage() {
  let items: Chip[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.chips ?? [];
  } catch {}

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#60a5fa' }}>Silicon</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Chips</h1>
        <p className="text-lg" style={{ color: '#64748b' }}>Microchips and integrated circuits used across our hardware catalog.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(c => {
            const style = TYPE_COLORS[c.type] ?? { bg: 'rgba(51,65,85,0.3)', text: '#94a3b8' };
            return (
              <div key={c.id} className="card-hover glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-bold text-base" style={{ color: '#e2e8f0' }}>{c.name}</h2>
                  {c.type && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ml-3" style={{ background: style.bg, color: style.text }}>
                      {c.type}
                    </span>
                  )}
                </div>
                {c.manufacturer && (
                  <p className="text-sm mb-3" style={{ color: '#64748b' }}>
                    <span style={{ color: '#475569' }}>by </span>{c.manufacturer}
                  </p>
                )}
                {c.notes && <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#64748b' }}>{c.notes}</p>}
                {c.datasheet_url && (
                  <a href={c.datasheet_url} target="_blank" rel="noopener"
                    className="inline-flex items-center gap-1 mt-4 text-xs font-medium transition-colors"
                    style={{ color: '#60a5fa' }}>
                    View Datasheet →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="text-5xl mb-4">🔬</p>
          <p className="font-medium" style={{ color: '#475569' }}>No chips in catalog yet.</p>
        </div>
      )}
    </div>
  );
}
