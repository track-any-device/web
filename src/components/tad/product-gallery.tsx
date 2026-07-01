'use client';

import React from 'react';
import { Card } from '@/components/ui';

/* Product detail image gallery — a covered main image plus clickable thumbnails. Square device
   photos, so object-cover fills cleanly. Shows just the main image when there's only one. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const imgs = images.filter(Boolean);
  const [active, setActive] = React.useState(0);
  const current = imgs[active] ?? imgs[0];

  if (imgs.length === 0) {
    return (
      <Card flushBody>
        <div className="grid aspect-square place-items-center bg-[var(--surface-sunken)]">
          <span className="text-[var(--text-subtle)]">No image</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      <Card flushBody>
        <div className="aspect-square overflow-hidden bg-[var(--surface-sunken)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={name} className="h-full w-full object-cover" />
        </div>
      </Card>
      {imgs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {imgs.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${name} — image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-16 w-16 overflow-hidden rounded-[var(--radius-md)] border-2 transition-colors ${
                i === active ? 'border-[var(--brand)]' : 'border-[var(--border)] hover:border-[var(--text-subtle)]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
