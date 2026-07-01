import { defineType, defineField } from 'sanity';

/* Device-type catalogue grid. Renders live `deviceType` docs from the catalog (via the web's
   getDeviceTypes), optionally filtered by category. No content is authored here beyond the header
   + which category to show — the products themselves come from the catalogue. */
export default defineType({
  name: 'productGrid',
  title: 'Product grid',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 2 }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'All', value: 'all' },
          { title: 'Car', value: 'car' },
          { title: 'Bike', value: 'bike' },
          { title: 'Person', value: 'person' },
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Product grid', subtitle: `Product grid · ${subtitle || 'all'}` }),
  },
});
