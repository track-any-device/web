import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const runtime = 'edge';

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
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#22d3ee' }}>Hardware</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Compute Boards</h1>
        <p className="text-lg" style={{ color: '#64748b' }}>Arduino, Raspberry Pi, ESP32 and other boards compatible with TAD101.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(b => (
            <div key={b.id} className="card-hover glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(59,130,246,0.2))' }}>
                  🖥️
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: '#e2e8f0' }}>{b.name}</h2>
                  {b.manufacturer && <p className="text-xs" style={{ color: '#64748b' }}>{b.manufacturer}</p>}
                </div>
              </div>

              <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: 'rgba(15,23,42,0.5)' }}>
                {[
                  { label: 'MCU',     value: b.mcu },
                  { label: 'Flash',   value: b.flash_kb != null  ? `${b.flash_kb} KB`  : null },
                  { label: 'RAM',     value: b.ram_kb != null    ? `${b.ram_kb} KB`    : null },
                  { label: 'Voltage', value: b.operating_voltage != null ? `${b.operating_voltage} V` : null },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex justify-between items-center text-xs">
                    <span style={{ color: '#475569' }}>{r.label}</span>
                    <span className="font-mono font-medium" style={{ color: '#94a3b8' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {b.notes && <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#64748b' }}>{b.notes}</p>}
              {b.datasheet_url && (
                <a href={b.datasheet_url} target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1 mt-3 text-xs font-medium"
                  style={{ color: '#60a5fa' }}>
                  View Datasheet →
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="text-5xl mb-4">🖥️</p>
          <p className="font-medium" style={{ color: '#475569' }}>No compute boards in catalog yet.</p>
        </div>
      )}
    </div>
  );
}
