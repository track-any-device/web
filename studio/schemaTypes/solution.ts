import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'solution',
  title: 'Solution',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'tagline', type: 'string' }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'icon', type: 'string', description: 'Lucide icon name' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'features', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'audience', type: 'string', options: { list: ['b2c', 'b2b'] } }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'sortOrder', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'title', subtitle: 'tagline' } },
});
