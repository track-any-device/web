import { defineType, defineField } from 'sanity';

/* HOME hero — the landing hero rendered WITH the animated globe. Use once, at the top of the
   home page's sections. For inner-page heroes (no globe) use the generic `hero` block. */
export default defineType({
  name: 'homeHero',
  title: 'Home hero (with globe)',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2 }),
    defineField({ name: 'primaryCta', title: 'Primary CTA', type: 'ctaLink' }),
    defineField({ name: 'secondaryCta', title: 'Secondary CTA', type: 'ctaLink' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Home hero', subtitle: subtitle ? `Home hero · ${subtitle}` : 'Home hero (with globe)' }),
  },
});
