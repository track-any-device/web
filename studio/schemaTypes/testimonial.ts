import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'company', type: 'string' }),
    defineField({ name: 'quote', type: 'text', validation: (r) => r.required() }),
    defineField({ name: 'rating', type: 'number', initialValue: 5, validation: (r) => r.min(1).max(5) }),
    defineField({ name: 'avatar', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'sortOrder', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'name', subtitle: 'company' } },
});
