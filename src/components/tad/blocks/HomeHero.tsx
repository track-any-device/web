import React from 'react';
import { Hero } from '@/components/tad/marketing';
import type { HomeHeroData } from '@/lib/pages';

/* HOME hero block — reuses the marketing Hero rendered WITH the animated globe (`full`). */
export function HomeHero({ eyebrow, title, subtitle, primaryCta, secondaryCta }: HomeHeroData) {
  return (
    <Hero
      full
      eyebrow={eyebrow}
      title={title ?? ''}
      subtitle={subtitle}
      primaryCta={primaryCta?.label && primaryCta?.href ? { label: primaryCta.label, href: primaryCta.href } : undefined}
      secondaryCta={secondaryCta?.label && secondaryCta?.href ? { label: secondaryCta.label, href: secondaryCta.href } : undefined}
    />
  );
}
