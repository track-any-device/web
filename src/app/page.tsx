import { makeServerClient } from '@/lib/apollo';
import { getSession } from '@/lib/auth';
import { gql } from '@apollo/client';

export const runtime = 'edge';

const HOME_QUERY = gql`
  query Home {
    featuredSolutions { id title slug description gradient_from gradient_to }
    featuredDeviceTypes { id name slug description price_usd }
  }
`;

interface Solution    { id: string; title: string; slug: string; description: string; gradient_from: string; gradient_to: string; }
interface DeviceType  { id: string; name: string; slug: string; description: string; price_usd: number; }

// The API returns Tailwind class names (e.g. "blue-900") — map to CSS hex values
const TW: Record<string, string> = {
  'slate-600':'#475569','slate-700':'#334155','slate-800':'#1e293b','slate-900':'#0f172a',
  'blue-600':'#2563eb','blue-700':'#1d4ed8','blue-800':'#1e40af','blue-900':'#1e3a8a',
  'indigo-600':'#4f46e5','indigo-700':'#4338ca','indigo-800':'#3730a3','indigo-900':'#312e81',
  'violet-600':'#7c3aed','violet-700':'#6d28d9','violet-800':'#5b21b6','violet-900':'#4c1d95',
  'green-600':'#16a34a','green-700':'#15803d','green-800':'#166534','green-900':'#14532d',
  'emerald-600':'#059669','emerald-700':'#047857','emerald-800':'#065f46','emerald-900':'#064e3b',
  'teal-600':'#0d9488','teal-700':'#0f766e','teal-800':'#115e59','teal-900':'#134e4a',
  'cyan-600':'#0891b2','cyan-700':'#0e7490','cyan-800':'#155e75','cyan-900':'#164e63',
  'sky-600':'#0284c7','sky-700':'#0369a1','sky-800':'#075985','sky-900':'#0c4a6e',
  'orange-600':'#ea580c','orange-700':'#c2410c','orange-800':'#9a3412','orange-900':'#7c2d12',
  'red-600':'#dc2626','red-700':'#b91c1c','red-800':'#991b1b','red-900':'#7f1d1d',
  'pink-600':'#db2777','pink-700':'#be185d','pink-800':'#9d174d','pink-900':'#831843',
  'purple-600':'#9333ea','purple-700':'#7e22ce','purple-800':'#6b21a8','purple-900':'#581c87',
};
function tw(val: string, fallback: string): string { return TW[val] ?? (val.startsWith('#') ? val : fallback); }

const STATS = [
  { value: '10k+',  label: 'Active Devices'   },
  { value: '99.9%', label: 'Platform Uptime'  },
  { value: '50ms',  label: 'Avg Latency'      },
  { value: '24/7',  label: 'Fleet Monitoring' },
];

const SSO_ERROR_MESSAGES: Record<string, string> = {
  invalid_scope:         'Sign-in configuration error — please contact support.',
  invalid_state:         'Sign-in session expired. Please try again.',
  token_exchange_failed: 'Sign-in failed — could not complete authentication. Please try again.',
  access_denied:         'Access denied. You do not have permission to sign in.',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sso_error?: string }>;
}) {
  const { sso_error: ssoError } = await searchParams;
  const session = await getSession();
  let solutions: Solution[]   = [];
  let products:  DeviceType[] = [];

  try {
    const { data } = await makeServerClient().query({ query: HOME_QUERY });
    solutions = data.featuredSolutions   ?? [];
    products  = data.featuredDeviceTypes ?? [];
  } catch {}

  const errorMessage = ssoError
    ? (SSO_ERROR_MESSAGES[ssoError] ?? 'Sign-in failed. Please try again.')
    : null;

  return (
    <>
      {/* ── SSO error banner ── */}
      {errorMessage && (
        <div role="alert" style={{ background: '#450a0a', borderBottom: '1px solid #7f1d1d' }}>
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
            <span style={{ color: '#fca5a5', fontSize: 16 }}>&#9888;</span>
            <p className="text-sm" style={{ color: '#fca5a5' }}>
              {errorMessage}
            </p>
            <a href="/" className="ml-auto text-xs underline shrink-0" style={{ color: '#f87171' }}>
              Dismiss
            </a>
          </div>
        </div>
      )}

      {/* ── Hero (intentionally dark — blue gradient band) ── */}
      <section className="hero-bg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(96,165,250,0.15)' }} />
        <div className="absolute top-32 right-1/4 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(6,182,212,0.1)' }} />

        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium"
            style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot bg-blue-300" />
            Real-time fleet visibility across every edge
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6" style={{ lineHeight: 1.08 }}>
            Track <span style={{ color: '#93c5fd' }}>Any Device</span><br />
            <span style={{ color: '#e2e8f0' }}>Anywhere, Instantly</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: '#94a3b8' }}>
            Monitor GPS trackers, IoT sensors, and compute boards in real time. Built for fleet operators, government agencies, and enterprise IoT teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <a href="/products" className="px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all glow-blue"
                style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                Browse Products →
              </a>
            ) : (
              <a href="/api/auth/login" className="px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all glow-blue"
                style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                Get Started — Sign In
              </a>
            )}
            <a href="/solutions" className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)' }}>
              View Solutions
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solutions (light bg) ── */}
      {solutions.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-primary">Use Cases</p>
              <h2 className="text-2xl font-bold text-foreground">Industry Solutions</h2>
            </div>
            <a href="/solutions" className="text-sm font-medium text-primary hover:underline">View all →</a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {solutions.map(s => (
              <a key={s.id} href={`/solutions#${s.slug}`}
                className="card-hover relative overflow-hidden rounded-2xl p-6 block group"
                style={{ background: `linear-gradient(135deg, ${tw(s.gradient_from, '#2563eb')}, ${tw(s.gradient_to, '#0891b2')})` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <p className="font-semibold text-lg text-white relative">{s.title}</p>
                {s.description && <p className="text-sm text-white/70 mt-1.5 line-clamp-2 relative">{s.description}</p>}
                <p className="text-xs text-white/50 mt-4 font-medium relative">Learn more →</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Products (light bg) ── */}
      {products.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-primary">Hardware</p>
                <h2 className="text-2xl font-bold text-foreground">Featured Products</h2>
              </div>
              <a href="/products" className="text-sm font-medium text-primary hover:underline">View all →</a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map(p => (
                <a key={p.id} href={`/products/${p.slug}`}
                  className="card-hover bg-card border border-border rounded-2xl overflow-hidden block group">
                  <div className="h-40 flex items-center justify-center text-5xl bg-accent/40 relative">
                    📡
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5" />
                  </div>
                  <div className="p-5">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                    {p.price_usd != null && <p className="font-bold mt-1 gradient-text text-sm">${p.price_usd}</p>}
                    {p.description && <p className="text-xs mt-1.5 line-clamp-2 text-muted-foreground">{p.description}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA band ── */}
      {!session && (
        <section className="border-y border-border bg-accent/20">
          <div className="max-w-7xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">Ready to track your fleet?</h2>
            <p className="mb-8 max-w-lg mx-auto text-muted-foreground">
              Sign in with your Track Any Device account to access your dashboard, manage devices, and monitor your fleet in real time.
            </p>
            <a href="/api/auth/login" className="inline-block px-8 py-3.5 rounded-xl font-semibold text-sm text-white glow-blue"
              style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
              Sign in with TAD SSO
            </a>
          </div>
        </section>
      )}
    </>
  );
}
