import { defineType, defineField } from 'sanity';

/* Full-screen hero — fills the viewport below the top bar. Text-led with an OPTIONAL image
   (no globe; the home page's globe hero is `homeHero`). Use once, at the top of a page. */
export default defineType({
  name: 'fullHero',
  title: 'Full-screen hero',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 3 }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 4,
      description: 'Optional second paragraph shown under the subtitle.',
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'url',
      description: 'Optional image shown beside the text (text spans the full width without it).',
    }),
    defineField({ name: 'primaryCta', title: 'Primary CTA', type: 'ctaLink' }),
    defineField({ name: 'secondaryCta', title: 'Secondary CTA', type: 'ctaLink' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Full-screen hero', subtitle: subtitle ? `Full-screen hero · ${subtitle}` : 'Full-screen hero' }),
  },
});
