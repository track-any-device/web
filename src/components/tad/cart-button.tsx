'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart';

/* Header cart icon — a ShoppingCart with a live count badge (sum of line quantities), linking to
   /cart. Hidden entirely while the cart is empty (or before hydration) so it never flashes a stale
   count on first paint. Sits in the header actions of SiteShell (marketing) and MyPortalShell (/my). */

export function CartButton() {
  const { count, ready } = useCart();

  if (!ready || count === 0) return null;

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="tad-usermenu__trigger"
      style={{ position: 'relative' }}
    >
      <span className="tad-usermenu__avatar" aria-hidden style={{ background: 'transparent', color: 'var(--text)' }}>
        <ShoppingCart size={17} strokeWidth={2} />
      </span>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -2,
          right: -2,
          minWidth: 17,
          height: 17,
          padding: '0 4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--brand)',
          color: 'var(--text-on-brand)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 700,
          lineHeight: 1,
          border: '2px solid var(--surface)',
        }}
      >
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}
