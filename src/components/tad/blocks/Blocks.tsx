import React from 'react';
import type { Section } from '@/lib/pages';
import { HomeHero } from './HomeHero';
import { HeroBlock } from './HeroBlock';
import { CtaBand } from './CtaBand';
import { Split } from './Split';
import { FeatureGrid } from './FeatureGrid';
import { StatsBand } from './StatsBand';
import { ProductGrid } from './ProductGrid';

/* Page-builder renderer. Maps each Sanity `section` by `_type` to its block component, keyed by
   `_key`, and skips unknown types. ProductGrid is an async server component — Next resolves it. */
export function Blocks({ sections }: { sections?: Section[] }) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((section) => {
        switch (section._type) {
          case 'homeHero':
            return <HomeHero key={section._key} {...section} />;
          case 'hero':
            return <HeroBlock key={section._key} {...section} />;
          case 'ctaBand':
            return <CtaBand key={section._key} {...section} />;
          case 'split':
            return <Split key={section._key} {...section} />;
          case 'featureGrid':
            return <FeatureGrid key={section._key} {...section} />;
          case 'statsBand':
            return <StatsBand key={section._key} {...section} />;
          case 'productGrid':
            return <ProductGrid key={section._key} {...section} />;
          default:
            // Unknown block type — skip so an unrecognised section never breaks the page.
            return null;
        }
      })}
    </>
  );
}
