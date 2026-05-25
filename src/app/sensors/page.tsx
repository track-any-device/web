import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Sensors' };

const QUERY = gql`
  query Sensors {
    sensors { id name label slug unit data_type protocol description icon }
  }
`;

interface Sensor { id: string; name: string; label: string; slug: string; unit: string; data_type: string; protocol: string; description: string; icon: string; }

const PROTOCOL_COLORS: Record<string, string> = {
  I2C: 'rgba(139,92,246,0.15)', SPI: 'rgba(59,130,246,0.15)', UART: 'rgba(234,179,8,0.15)', GPIO: 'rgba(34,197,94,0.15)', '1-Wire': 'rgba(239,68,68,0.15)',
};
const PROTOCOL_TEXT: Record<string, string> = {
  I2C: '#a78bfa', SPI: '#60a5fa', UART: '#facc15', GPIO: '#4ade80', '1-Wire': '#f87171',
};

export default async function SensorsPage() {
  let items: Sensor[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.sensors ?? [];
  } catch {}

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a78bfa' }}>Peripherals</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Sensors</h1>
        <p className="text-lg" style={{ color: '#64748b' }}>All sensor types supported by the TAD101 universal protocol.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(s => {
            const bg   = PROTOCOL_COLORS[s.protocol] ?? 'rgba(51,65,85,0.2)';
            const text = PROTOCOL_TEXT[s.protocol]   ?? '#94a3b8';
            return (
              <div key={s.id} className="card-hover glass rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(51,65,85,0.5)' }}>
                    {s.icon ?? '🔌'}
                  </div>
                  <h2 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{s.label ?? s.name}</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {s.unit && <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>{s.unit}</span>}
                  {s.protocol && <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: bg, color: text }}>{s.protocol}</span>}
                </div>
                {s.data_type && <p className="text-xs mb-1" style={{ color: '#475569' }}>Type: <span style={{ color: '#94a3b8' }}>{s.data_type}</span></p>}
                {s.description && <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: '#64748b' }}>{s.description}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="text-5xl mb-4">🔌</p>
          <p className="font-medium" style={{ color: '#475569' }}>No sensors in catalog yet.</p>
        </div>
      )}
    </div>
  );
}
