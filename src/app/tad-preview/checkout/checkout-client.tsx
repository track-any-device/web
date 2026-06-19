'use client';
import React from 'react';
import Link from 'next/link';
import { Input, Button, Card, Badge } from '@/components/ui';
import { PRODUCTS } from '../_products';

/* Cash-on-Delivery checkout (PKR). Placeholder cart = first catalog item + its 1-year subscription. */

export function CheckoutClient() {
  const [done, setDone] = React.useState(false);
  const item = PRODUCTS[0];
  const price = item.price ?? 0;
  const delivery = 0; // COD, free delivery placeholder
  const total = price + delivery;
  const money = (n: number) => `Rs ${n.toLocaleString('en-PK')}`;

  if (done) {
    return (
      <Card>
        <div style={{ display: 'grid', gap: 'var(--space-3)', placeItems: 'center', textAlign: 'center', padding: 'var(--space-8)' }}>
          <Badge variant="success" dot>Order placed</Badge>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>Thank you!</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
            We&apos;ll call to confirm your cash-on-delivery order and have your {item.name} on its way shortly.
          </p>
          <Link href="/tad-preview/shop" className="tad-btn tad-btn--secondary">Continue shopping</Link>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-8)', alignItems: 'start' }}>
      <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Delivery details</h2>
        <Input label="Full name" required placeholder="Your name" />
        <Input label="Phone" required mono placeholder="03xx xxxxxxx" />
        <Input label="Delivery address" required placeholder="House, street, area" />
        <Input label="City" required placeholder="Lahore" />
        <Button type="submit" size="lg" block>Place order · Cash on delivery</Button>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          No online payment — pay in cash when your device is delivered.
        </p>
      </form>

      <Card title="Order summary" footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span className="tad-data" style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{money(total)}</span>
        </div>
      }>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>{item.name}<br /><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Includes 1-year subscription</span></span>
            <span className="tad-data">{money(price)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Delivery</span>
            <span className="tad-data">Free</span>
          </div>
          <Badge variant="brand">Cash on delivery · PKR</Badge>
        </div>
      </Card>
    </div>
  );
}
