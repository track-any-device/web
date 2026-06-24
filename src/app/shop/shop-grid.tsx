'use client';
import React from 'react';
import { Tabs } from '@/components/ui';
import { ProductCard } from '@/components/tad/marketing';
import type { Product } from '@/lib/products';

const CATS = [
  { value: 'all', label: 'All' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'person', label: 'Person' },
];

export function ShopGrid({ products }: { products: Product[] }) {
  const [cat, setCat] = React.useState('all');
  const items = cat === 'all' ? products : products.filter((p) => p.category === cat);
  return (
    <div className="grid gap-6">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
        <Tabs variant="pill" value={cat} onChange={setCat} items={CATS} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => <ProductCard key={p.name} {...p} href={`/products/${p.slug}`} />)}
      </div>
    </div>
  );
}
