import React from 'react';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/tad/site-shell';
import { Section } from '@/components/tad/marketing';
import { CartClient } from './cart-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Your cart' };

/* Cart surface — wrapped in SiteShell (shared marketing chrome + header cart icon). The cart itself
   is client state (localStorage via CartProvider), so the body is a client component. */

export default function CartPage() {
  return (
    <SiteShell>
      <Section width="lg" eyebrow="Cart" title="Your cart">
        <CartClient />
      </Section>
    </SiteShell>
  );
}
