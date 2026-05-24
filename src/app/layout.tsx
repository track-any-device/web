import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Track Any Device', template: '%s — Track Any Device' },
  description: 'Real-time IoT fleet tracking platform — GPS trackers, sensors, compute boards.',
};

const NAV = [
  { label: 'Products',       href: '/products' },
  { label: 'Solutions',      href: '/solutions' },
  { label: 'Chips',          href: '/chips' },
  { label: 'Compute Boards', href: '/components' },
  { label: 'Sensors',        href: '/sensors' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-blue-600 text-lg tracking-tight">
              Track Any Device
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              {NAV.map(n => (
                <a key={n.href} href={n.href} className="hover:text-blue-600 transition-colors">
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>

        <footer className="border-t border-gray-200 mt-20 py-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Track Any Device · IoT Fleet Platform
        </footer>
      </body>
    </html>
  );
}
