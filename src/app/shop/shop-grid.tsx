'use client';
import React from 'react';
import { Tabs } from '@/components/ui';
import { ProductCard } from '@/components/tad/marketing';
import { AddToCartMini } from '@/components/tad/add-to-cart-mini';
import { slugify, type ShopProduct } from '@/lib/shop-api';
import type { Product } from '@/lib/products';

const CATS = [
  { value: 'all', label: 'All' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'person', label: 'Person' },
];

export function ShopGrid({ products, orderable = [] }: { products: Product[]; orderable?: ShopProduct[] }) {
  const [cat, setCat] = React.useState('all');
  const items = cat === 'all' ? products : products.filter((p) => p.category === cat);

  // Index orderable products by slugified sku + name so each card can find its real DB product.
  const bySlug = React.useMemo(() => {
    const map = new Map<string, ShopProduct>();
    for (const op of orderable) {
      map.set(slugify(op.sku), op);
      map.set(slugify(op.name), op);
    }
    return map;
  }, [orderable]);

  return (
    <div className="grid gap-6">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
        <Tabs variant="pill" value={cat} onChange={setCat} items={CATS} />
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-14 text-center">
          <p className="font-[var(--font-display)] text-lg font-bold text-[var(--text)]">No products to show yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {cat === 'all'
              ? 'Our catalogue is being updated — please check back soon.'
              : 'No products in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => {
            const op = p.slug ? bySlug.get(slugify(p.slug)) : undefined;
            return (
              <ProductCard
                key={p.slug || p.name}
                {...p}
                href={`/products/${p.slug}`}
                addToCart={op && op.inStock ? <AddToCartMini product={op} /> : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
