'use client';
import React from 'react';
import Link from 'next/link';
import { Input, Button, Card, Badge } from '@/components/ui';
import { PRODUCTS } from '@/lib/products';

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
        <div className="grid place-items-center gap-3 p-8 text-center">
          <Badge variant="success" dot>Order placed</Badge>
          <h2 className="text-[length:var(--text-2xl)] font-extrabold">Thank you!</h2>
          <p className="max-w-[380px] text-[var(--text-secondary)]">
            We&apos;ll call to confirm your cash-on-delivery order and have your {item.name} on its way shortly.
          </p>
          <Link href="/shop" className="tad-btn tad-btn--secondary">Continue shopping</Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="grid gap-4">
        <h2 className="text-[length:var(--text-xl)] font-bold">Delivery details</h2>
        <Input label="Full name" required placeholder="Your name" />
        <Input label="Phone" required mono placeholder="03xx xxxxxxx" />
        <Input label="Delivery address" required placeholder="House, street, area" />
        <Input label="City" required placeholder="Lahore" />
        <Button type="submit" size="lg" block>Place order · Cash on delivery</Button>
        <p className="text-center text-[length:var(--text-xs)] text-[var(--text-muted)]">
          No online payment — pay in cash when your device is delivered.
        </p>
      </form>

      <Card title="Order summary" footer={
        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span className="tad-data text-[length:var(--text-lg)] font-semibold">{money(total)}</span>
        </div>
      }>
        <div className="grid gap-3">
          <div className="flex justify-between gap-3">
            <span>{item.name}<br /><span className="text-[length:var(--text-xs)] text-[var(--text-muted)]">Includes 1-year subscription</span></span>
            <span className="tad-data">{money(price)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Delivery</span>
            <span className="tad-data">Free</span>
          </div>
          <Badge variant="brand">Cash on delivery · PKR</Badge>
        </div>
      </Card>
    </div>
  );
}
