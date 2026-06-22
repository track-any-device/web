import { defineType, defineField } from 'sanity';

/* Sellable add-on. `accessoryId` maps to the operational accessory record in app. */
export default defineType({
  name: 'accessory',
  title: 'Accessory',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'pricePkr', title: 'Price (PKR)', type: 'number' }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'compatibleWith', title: 'Compatible with', type: 'array', of: [{ type: 'string' }], options: { list: ['car', 'bike', 'person'] }, description: 'Device categories this accessory fits.' }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'sortOrder', title: 'Sort order', type: 'number', initialValue: 0 }),
    defineField({ name: 'accessoryId', title: 'App accessory_id', type: 'number', description: 'Maps to the operational accessory record in app.' }),
  ],
  preview: { select: { title: 'name', subtitle: 'pricePkr' } },
});
