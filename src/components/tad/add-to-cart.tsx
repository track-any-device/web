'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/lib/cart';
import type { ShopProduct } from '@/lib/shop-api';

/* Product-detail order action. `product` is the orderable product resolved server-side from the
   Shop API (the real DB id). When null/out of stock, ordering is disabled — we never fabricate a
   product_id. A small qty stepper feeds useCart().add(); "Buy now" adds then goes to /checkout. */

export function AddToCart({ product }: { product: ShopProduct | null }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  if (!product || !product.inStock) {
    return (
      <div className="tad-cta-row mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className="tad-btn tad-btn--primary tad-btn--lg" disabled>
          <ShoppingCart size={18} strokeWidth={2} />
          Add to cart
        </button>
        <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
          {product && !product.inStock ? 'Out of stock' : 'Not available for online order'}
        </span>
      </div>
    );
  }

  const max = product.maxOrderQuantity && product.maxOrderQuantity > 0 ? product.maxOrderQuantity : 99;
  const clamp = (n: number) => Math.max(1, Math.min(max, n));

  function addToCart() {
    add(
      { productId: product!.id, sku: product!.sku, name: product!.name, price: product!.price, image: product!.image },
      qty,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    addToCart();
    router.push('/checkout');
  }

  return (
    <div className="mt-2 grid gap-3">
      <div className="flex items-center gap-3">
        <div
          className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] p-1"
          style={{ border: '1px solid var(--border)' }}
        >
          <button
            type="button"
            className="tad-iconbtn tad-iconbtn--sm"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => clamp(q - 1))}
            disabled={qty <= 1}
          >
            <Minus size={16} strokeWidth={2.2} />
          </button>
          <span className="tad-data min-w-[2ch] text-center font-semibold" aria-live="polite">{qty}</span>
          <button
            type="button"
            className="tad-iconbtn tad-iconbtn--sm"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => clamp(q + 1))}
            disabled={qty >= max}
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        </div>
        {product.maxOrderQuantity ? (
          <span className="text-[length:var(--text-xs)] text-[var(--text-muted)]">Max {max} per order</span>
        ) : null}
      </div>

      <div className="tad-cta-row flex flex-wrap gap-3">
        <button type="button" className="tad-btn tad-btn--primary tad-btn--lg" onClick={addToCart}>
          {added ? <Check size={18} strokeWidth={2.4} /> : <ShoppingCart size={18} strokeWidth={2} />}
          {added ? 'Added to cart' : 'Add to cart'}
        </button>
        <button type="button" className="tad-btn tad-btn--secondary tad-btn--lg" onClick={buyNow}>
          Buy now · Cash on delivery
        </button>
      </div>
    </div>
  );
}
