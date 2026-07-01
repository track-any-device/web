import { defineType, defineField } from 'sanity';

/* Sellable device catalog. Sanity owns sellable/marketing content; `deviceTypeId` maps to the
   operational `device_types` row in app. `originalModel` drives which decoder/driver app evaluates. */
export default defineType({
  name: 'deviceType',
  title: 'Device type',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: { list: [{ title: 'Car', value: 'car' }, { title: 'Bike', value: 'bike' }, { title: 'Person', value: 'person' }], layout: 'radio' }, validation: (r) => r.required() }),
    defineField({ name: 'originalModel', title: 'Original model', type: 'string', description: 'Hardware model the device-type driver is evaluated on (e.g. gt06n, p901).' }),
    defineField({ name: 'protocol', title: 'Protocol', type: 'string', options: { list: ['GT06', 'JT808'] } }),
    defineField({ name: 'vendor', title: 'Vendor', type: 'string' }),
    defineField({ name: 'pricePkr', title: 'Price (PKR)', type: 'number' }),
    defineField({ name: 'image', title: 'Main image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'images', title: 'Gallery images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }], description: 'Additional photos shown alongside the main image on the product detail page.' }),
    defineField({ name: 'imageUrl', title: 'Image URL (interim)', type: 'url', description: 'Temporary path until images are uploaded as assets.' }),
    defineField({ name: 'features', title: 'Features', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'typeApproved', title: 'Type-approved', type: 'boolean', initialValue: true }),
    defineField({ name: 'includesSubscriptionYears', title: 'Included subscription (years)', type: 'number', initialValue: 1 }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'sortOrder', title: 'Sort order', type: 'number', initialValue: 0 }),
    defineField({ name: 'deviceTypeId', title: 'App device_type_id', type: 'number', description: 'Maps to the operational device_types row in app.' }),
  ],
  preview: { select: { title: 'name', subtitle: 'category', media: 'image' } },
});
