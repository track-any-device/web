import React from 'react';
import { Hero } from '@/components/tad/marketing';
import type { HeroData } from '@/lib/pages';

/* Generic hero block — reuses the marketing Hero WITHOUT the globe (panel variant). */
export function HeroBlock({ eyebrow, title, subtitle, primaryCta, secondaryCta }: HeroData) {
  return (
    <Hero
      eyebrow={eyebrow}
      title={title ?? ''}
      subtitle={subtitle}
      primaryCta={primaryCta?.label && primaryCta?.href ? { label: primaryCta.label, href: primaryCta.href } : undefined}
      secondaryCta={secondaryCta?.label && secondaryCta?.href ? { label: secondaryCta.label, href: secondaryCta.href } : undefined}
    />
  );
}
