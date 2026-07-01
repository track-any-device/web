import { defineType, defineField } from 'sanity';

/* Responsive feature grid — N columns of { icon, title, text }. `icon` is a lucide-react icon
   name (e.g. 'MapPin'); the web renderer maps it to a component and falls back to a default. */
export default defineType({
  name: 'featureGrid',
  title: 'Feature grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2 }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      options: { list: [2, 3, 4] },
      initialValue: 3,
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [
        defineField({
          name: 'feature',
          title: 'Feature',
          type: 'object',
          fields: [
            defineField({ name: 'icon', title: 'Icon', type: 'string', description: "A lucide-react icon name, e.g. 'MapPin', 'Bell', 'ShieldCheck'." }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'title', subtitle: 'icon' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', features: 'features' },
    prepare: ({ title, features }) => ({ title: title || 'Feature grid', subtitle: `Feature grid · ${(features || []).length} feature(s)` }),
  },
});
