import { defineType, defineField } from 'sanity';

/* 50/50 text + media row. `mediaSide` positions the image left or right (stacks on mobile). */
export default defineType({
  name: 'split',
  title: 'Split (text + media)',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'body', title: 'Body', type: 'text', rows: 4 }),
    defineField({ name: 'imageUrl', title: 'Image URL', type: 'url' }),
    defineField({ name: 'cta', title: 'CTA', type: 'ctaLink' }),
    defineField({
      name: 'mediaSide',
      title: 'Media side',
      type: 'string',
      options: { list: [{ title: 'Left', value: 'left' }, { title: 'Right', value: 'right' }], layout: 'radio' },
      initialValue: 'right',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Split', subtitle: subtitle ? `Split · ${subtitle}` : 'Split (text + media)' }),
  },
});
