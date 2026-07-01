import { defineType, defineField } from 'sanity';

/* Stats band — a row of { value, label } figures (e.g. "99.9% uptime"). */
export default defineType({
  name: 'statsBand',
  title: 'Stats band',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      of: [
        defineField({
          name: 'stat',
          title: 'Stat',
          type: 'object',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string' }),
            defineField({ name: 'label', title: 'Label', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', stats: 'stats' },
    prepare: ({ title, stats }) => ({ title: title || 'Stats band', subtitle: `Stats band · ${(stats || []).length} stat(s)` }),
  },
});
