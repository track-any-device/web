import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Section } from '@/components/tad/marketing';
import { CheckoutClient } from './checkout-client';

/* Checkout surface (PREVIEW at /tad-preview/checkout) — Cash-on-Delivery, PKR. */

export default function CheckoutPreview() {
  return (
    <SiteShell>
      <Section width="lg" eyebrow="Checkout" title="Cash on delivery">
        <CheckoutClient />
      </Section>
    </SiteShell>
  );
}
