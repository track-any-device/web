import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: { default: 'TAD-PAK — Track Any Device', template: '%s — TAD-PAK' },
  description: 'Real-time GPS tracking for cars, bikes, and people across Pakistan.',
};

/**
 * Minimal root shell. Chrome is owned per-section: marketing pages wrap themselves in
 * `SiteShell`, account/auth pages in `AuthLayout`, and `/my` has its own portal layout.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="default">
      <body className="min-h-screen bg-background text-foreground">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
