import type { Metadata } from 'next';
import './globals.css';
import { getSession } from '@/lib/auth';
import { AppLogo } from '@trackany-device/components';

export const metadata: Metadata = {
  title: { default: 'Track Any Device', template: '%s — Track Any Device' },
  description: 'Real-time IoT fleet tracking platform — GPS trackers, sensors, compute boards.',
};

const NAV = [
  { label: 'Home',      href: '/'          },
  { label: 'Shop',      href: '/shop'      },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Support',   href: '/support'   },
];

const FOOTER_COLS = [
  {
    heading: 'Platform',
    links: [
      { l: 'Products',  h: '/products'  },
      { l: 'Solutions', h: '/solutions' },
      { l: 'Sensors',   h: '/sensors'   },
    ],
  },
  {
    heading: 'Hardware',
    links: [
      { l: 'Products',       h: '/shop'       },
      { l: 'Chips',          h: '/chips'      },
      { l: 'Compute Boards', h: '/components' },
      { l: 'Accessories',    h: '/shop#accessories' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { l: 'Contact',        h: '/support'    },
      { l: 'Documentation',  h: '/docs'       },
    ],
  },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user    = session?.user as { name?: string; email?: string } | undefined;

  return (
    <html lang="en" data-theme="default">
      <body className="min-h-screen bg-background text-foreground">

        {/* ── Navigation ── */}
        <header className="nav-blur sticky top-0 z-50 border-b border-border bg-background/90">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0">
              <AppLogo src="/logo.png" alt="Track Any Device" className="h-8" />
            </a>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map(n => (
                <a key={n.href} href={n.href}
                  className="px-3 py-1.5 text-sm font-medium transition-colors nav-link">
                  {n.label}
                </a>
              ))}
            </nav>

            {/* Auth / CTA */}
            <div className="flex items-center gap-3 shrink-0">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                      {(user?.name ?? user?.email ?? 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-muted-foreground">{user?.name ?? user?.email}</span>
                  </div>
                  <a href="/my/devices"
                    className="px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all glow-blue"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                    My Devices
                  </a>
                </div>
              ) : (
                <a href="/api/auth/login"
                  className="px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all glow-blue"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                  Get Started
                </a>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main>{children}</main>

        {/* ── Footer ── */}
        <footer className="mt-24 border-t border-border py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
              <div className="sm:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <AppLogo src="/logo.png" alt="Track Any Device" className="h-7" />
                  <span className="font-semibold text-sm gradient-text">Track Any Device</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Real-time IoT fleet tracking for enterprise, government, and field teams.
                </p>
              </div>
              {FOOTER_COLS.map(col => (
                <div key={col.heading}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground">{col.heading}</p>
                  <ul className="space-y-2">
                    {col.links.map(({ l, h }) => (
                      <li key={h}>
                        <a href={h} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} Track Any Device. All rights reserved.</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                All systems operational
              </span>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
