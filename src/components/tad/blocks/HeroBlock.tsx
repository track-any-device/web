import React from 'react';
import { Hero } from '@/components/tad/marketing';
import type { HeroData } from '@/lib/pages';

/* Generic hero block — the marketing Hero panel variant: text with an optional image, no globe. */
export function HeroBlock({ eyebrow, title, subtitle, imageUrl, primaryCta, secondaryCta }: HeroData) {
  return (
    <Hero
      eyebrow={eyebrow}
      title={title ?? ''}
      subtitle={subtitle}
      image={imageUrl}
      primaryCta={primaryCta?.label && primaryCta?.href ? { label: primaryCta.label, href: primaryCta.href } : undefined}
      secondaryCta={secondaryCta?.label && secondaryCta?.href ? { label: secondaryCta.label, href: secondaryCta.href } : undefined}
    />
  );
}
