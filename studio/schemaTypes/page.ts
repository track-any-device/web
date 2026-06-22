import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'metaTitle', type: 'string' }),
    defineField({ name: 'metaDescription', type: 'text' }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
});
