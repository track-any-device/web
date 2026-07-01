import { defineType, defineField } from 'sanity';

/* Full-width call-to-action band — a title/subtitle + a single CTA. `tone` picks the surface. */
export default defineType({
  name: 'ctaBand',
  title: 'CTA band',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2 }),
    defineField({ name: 'cta', title: 'CTA', type: 'ctaLink', validation: (r) => r.required() }),
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      options: { list: [{ title: 'Brand', value: 'brand' }, { title: 'Sand', value: 'sand' }], layout: 'radio' },
      initialValue: 'brand',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'tone' },
    prepare: ({ title, subtitle }) => ({ title: title || 'CTA band', subtitle: `CTA band · ${subtitle || 'brand'}` }),
  },
});
