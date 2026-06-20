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
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <Tabs variant="pill" value={cat} onChange={setCat} items={CATS} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
        {items.map((p) => <ProductCard key={p.name} {...p} href={`/products/${p.slug}`} />)}
      </div>
    </div>
  );
}
