import deviceType from './deviceType';
import accessory from './accessory';
import solution from './solution';
import page from './page';
import blog from './blog';
import testimonial from './testimonial';
import navLink from './navLink';
import docPage from './docPage';

// Page-builder: shared object + block types (registered so `page.sections` can reference them).
import ctaLink from './ctaLink';
import homeHero from './blocks/homeHero';
import hero from './blocks/hero';
import fullHero from './blocks/fullHero';
import ctaBand from './blocks/ctaBand';
import split from './blocks/split';
import featureGrid from './blocks/featureGrid';
import statsBand from './blocks/statsBand';
import productGrid from './blocks/productGrid';

export const schemaTypes = [
  deviceType,
  accessory,
  solution,
  page,
  blog,
  testimonial,
  navLink,
  docPage,
  // page-builder object + blocks
  ctaLink,
  homeHero,
  hero,
  fullHero,
  ctaBand,
  split,
  featureGrid,
  statsBand,
  productGrid,
];
