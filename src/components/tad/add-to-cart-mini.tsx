'use client';

import React from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/lib/cart';
import type { ShopProduct } from '@/lib/shop-api';

/* Compact Add-to-cart used on shop grid cards. Adds a single unit of the real orderable product
   (resolved server-side from the Shop API) to the cart, with brief confirmation feedback. */

export function AddToCartMini({ product }: { product: ShopProduct }) {
  const { add } = useCart();
  const [added, setAdded] = React.useState(false);

  function onClick() {
    add({ productId: product.id, sku: product.sku, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button type="button" className="tad-btn tad-btn--primary tad-btn--sm" onClick={onClick}>
      {added ? <Check size={15} strokeWidth={2.4} /> : <ShoppingCart size={15} strokeWidth={2} />}
      {added ? 'Added' : 'Add to cart'}
    </button>
  );
}
