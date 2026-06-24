'use client';

import React from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui';
import { useCart, formatPkr } from '@/lib/cart';

/* Cart page body — lists each line (image, name, sku, qty stepper, line total), the subtotal, and
   a "Proceed to checkout" CTA. Friendly empty state when there is nothing in the cart. */

export function CartClient() {
  const { items, subtotal, count, ready, setQty, remove } = useCart();

  if (!ready) {
    return <div className="py-16 text-center text-[var(--text-muted)]">Loading your cart…</div>;
  }

  if (items.length === 0) {
    return (
      <Card>
        <div className="grid place-items-center gap-3 p-10 text-center">
          <span
            className="grid h-14 w-14 place-items-center rounded-full"
            style={{ background: 'var(--brand-subtle)', color: 'var(--brand-on-subtle)' }}
            aria-hidden
          >
            <ShoppingCart size={24} strokeWidth={2} />
          </span>
          <h2 className="text-[length:var(--text-2xl)] font-extrabold">Your cart is empty</h2>
          <p className="max-w-[380px] text-[var(--text-secondary)]">
            Browse our GPS trackers and add a device to get started — cash on delivery across Pakistan.
          </p>
          <Link href="/shop" className="tad-btn tad-btn--primary tad-btn--lg">Browse the shop</Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.productId} flushBody>
            <div className="flex items-center gap-4 p-4">
              <div
                className="grid aspect-square w-20 flex-none place-items-center overflow-hidden rounded-[var(--radius-lg)]"
                style={{ background: 'var(--surface-sunken)' }}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="max-h-[80%] max-w-[80%] object-contain" />
                ) : (
                  <span className="text-[length:var(--text-xs)] text-[var(--text-subtle)]">No image</span>
                )}
              </div>

              <div className="grid min-w-0 flex-1 gap-1">
                <h3 className="truncate text-[length:var(--text-base)] font-bold">{item.name}</h3>
                <span className="tad-data text-[length:var(--text-xs)] text-[var(--text-muted)]">{item.sku}</span>
                <span className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{formatPkr(item.price)} each</span>
              </div>

              <div className="grid justify-items-end gap-2">
                <div
                  className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] p-1"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <button
                    type="button"
                    className="tad-iconbtn tad-iconbtn--sm"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() => setQty(item.productId, item.qty - 1)}
                  >
                    <Minus size={15} strokeWidth={2.2} />
                  </button>
                  <span className="tad-data min-w-[2ch] text-center font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    className="tad-iconbtn tad-iconbtn--sm"
                    aria-label={`Increase ${item.name} quantity`}
                    onClick={() => setQty(item.productId, item.qty + 1)}
                  >
                    <Plus size={15} strokeWidth={2.2} />
                  </button>
                </div>
                <span className="tad-data text-[length:var(--text-base)] font-semibold">{formatPkr(item.price * item.qty)}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[length:var(--text-xs)]"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => remove(item.productId)}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Remove
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Order summary"
        footer={
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">Subtotal</span>
              <span className="tad-data text-[length:var(--text-lg)] font-semibold">{formatPkr(subtotal)}</span>
            </div>
            <Link href="/checkout" className="tad-btn tad-btn--primary tad-btn--lg tad-btn--block">
              Proceed to checkout
            </Link>
          </div>
        }
      >
        <div className="grid gap-2 text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>{count} item{count === 1 ? '' : 's'}</span>
            <span className="tad-data">{formatPkr(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span className="tad-data">Free · COD</span>
          </div>
          <Link href="/shop" className="tad-btn tad-btn--ghost tad-btn--sm mt-1 justify-self-start">
            Continue shopping
          </Link>
        </div>
      </Card>
    </div>
  );
}
