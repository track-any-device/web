import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import type { SplitData } from '@/lib/pages';

/* 50/50 text + media row. `mediaSide` places the media left or right on desktop; stacks (text first)
   on mobile. `imageUrl` is a plain URL string — no image asset resolution needed. */
export function Split({ eyebrow, title, body, imageUrl, cta, mediaSide = 'right' }: SplitData) {
  const mediaLeft = mediaSide === 'left';

  const media = (
    <Card flushBody className={mediaLeft ? 'md:order-1' : 'md:order-2'}>
      <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-[var(--surface-sunken)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title ?? ''} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[length:var(--text-sm)] text-[var(--text-subtle)]">No image</span>
        )}
      </div>
    </Card>
  );

  const text = (
    <div className={`grid content-center gap-4 ${mediaLeft ? 'md:order-2' : 'md:order-1'}`}>
      {eyebrow && <span className="tad-eyebrow">{eyebrow}</span>}
      {title && (
        <h2 className="text-[length:var(--text-3xl)] font-extrabold tracking-[var(--tracking-tighter)]">{title}</h2>
      )}
      {body && <p className="m-0 text-[length:var(--text-lg)] leading-normal text-[var(--text-secondary)]">{body}</p>}
      {cta?.label && cta?.href && (
        <div className="tad-cta-row mt-1 flex flex-wrap gap-3">
          <Link href={cta.href} className="tad-btn tad-btn--primary tad-btn--lg">{cta.label}</Link>
        </div>
      )}
    </div>
  );

  return (
    <section className="tad-section px-5 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto grid items-center gap-8 md:grid-cols-2 md:gap-12" style={{ maxWidth: 'var(--container-xl)' }}>
        {text}
        {media}
      </div>
    </section>
  );
}
