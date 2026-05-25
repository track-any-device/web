import { makeServerClient } from '@/lib/apollo';
import { gql } from '@apollo/client';
import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Solutions' };

const QUERY = gql`
  query Solutions {
    solutions { id title slug description icon_name gradient_from gradient_to cta_label cta_href }
  }
`;

interface Solution { id: string; title: string; slug: string; description: string; icon_name: string; gradient_from: string; gradient_to: string; cta_label: string; cta_href: string; }

const TW: Record<string, string> = {
  'slate-600':'#475569','slate-700':'#334155','slate-800':'#1e293b','slate-900':'#0f172a',
  'blue-600':'#2563eb','blue-700':'#1d4ed8','blue-800':'#1e40af','blue-900':'#1e3a8a',
  'indigo-600':'#4f46e5','indigo-700':'#4338ca','indigo-800':'#3730a3','indigo-900':'#312e81',
  'green-600':'#16a34a','green-700':'#15803d','green-800':'#166534','green-900':'#14532d',
  'emerald-600':'#059669','emerald-700':'#047857','emerald-800':'#065f46','emerald-900':'#064e3b',
  'teal-600':'#0d9488','teal-700':'#0f766e','teal-800':'#115e59','teal-900':'#134e4a',
  'cyan-600':'#0891b2','cyan-700':'#0e7490','cyan-800':'#155e75','cyan-900':'#164e63',
  'sky-600':'#0284c7','sky-700':'#0369a1','sky-800':'#075985','sky-900':'#0c4a6e',
  'orange-600':'#ea580c','orange-700':'#c2410c','orange-800':'#9a3412','orange-900':'#7c2d12',
  'red-600':'#dc2626','red-700':'#b91c1c','red-800':'#991b1b','red-900':'#7f1d1d',
  'purple-600':'#9333ea','purple-700':'#7e22ce','purple-800':'#6b21a8','purple-900':'#581c87',
  'pink-600':'#db2777','pink-700':'#be185d','pink-800':'#9d174d','pink-900':'#831843',
};
function tw(val: string, fallback: string): string { return TW[val] ?? (val.startsWith('#') ? val : fallback); }

export default async function SolutionsPage() {
  let items: Solution[] = [];
  try {
    const { data } = await makeServerClient().query({ query: QUERY });
    items = data.solutions ?? [];
  } catch {}

  return (
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#06b6d4' }}>Use Cases</p>
        <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f1f5f9' }}>Solutions</h1>
        <p className="text-lg" style={{ color: '#64748b' }}>Industry-specific tracking and monitoring solutions.</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(s => (
            <div key={s.id} id={s.slug}
              className="card-hover glass rounded-2xl overflow-hidden group">
              {/* Gradient banner */}
              <div className="h-36 flex items-center justify-center text-4xl relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${tw(s.gradient_from, '#2563eb')}, ${tw(s.gradient_to, '#0891b2')})` }}>
                {s.icon_name ?? '⚙️'}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div className="p-6">
                <h2 className="font-semibold text-base mb-2" style={{ color: '#e2e8f0' }}>{s.title}</h2>
                {s.description && <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#64748b' }}>{s.description}</p>}
                {s.cta_href && (
                  <a href={s.cta_href}
                    className="inline-flex items-center gap-1 mt-4 text-sm font-medium transition-colors"
                    style={{ color: '#60a5fa' }}>
                    {s.cta_label ?? 'Learn more'} <span>→</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32">
          <p className="text-5xl mb-4">⚙️</p>
          <p className="font-medium" style={{ color: '#475569' }}>No solutions yet.</p>
        </div>
      )}
    </div>
  );
}
