import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'navLink',
  title: 'Nav link',
  type: 'document',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'href', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'group', type: 'string', options: { list: ['header', 'footer'] }, initialValue: 'footer' }),
    defineField({ name: 'column', type: 'string', description: 'Footer column heading (e.g. Track, Company, Account).' }),
    defineField({ name: 'sortOrder', type: 'number', initialValue: 0 }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
});
