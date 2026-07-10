import { defineType, defineField } from 'sanity';

/* Generic hero (no globe) — for inner pages. The home page's top hero should use `homeHero`. */
export default defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2 }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'url',
      description: 'Optional image shown beside the text (text-only without it).',
    }),
    defineField({ name: 'primaryCta', title: 'Primary CTA', type: 'ctaLink' }),
    defineField({ name: 'secondaryCta', title: 'Secondary CTA', type: 'ctaLink' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Hero', subtitle: subtitle ? `Hero · ${subtitle}` : 'Hero' }),
  },
});
