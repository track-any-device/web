import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'blog',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'excerpt', type: 'text' }),
    defineField({ name: 'coverImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'publishedAt', type: 'datetime' }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
  ],
  preview: { select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' } },
});
