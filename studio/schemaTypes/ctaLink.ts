import { defineType, defineField } from 'sanity';

/* Reusable call-to-action link — a labelled href used by hero + band + split blocks. */
export default defineType({
  name: 'ctaLink',
  title: 'CTA link',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', title: 'Href', type: 'string', validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
});
