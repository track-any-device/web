import { defineType, defineField, defineArrayMember } from 'sanity';

/* Custom body blocks --------------------------------------------------- */

const codeBlock = defineArrayMember({
  name: 'codeBlock',
  title: 'Code block',
  type: 'object',
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      description: 'Syntax / label shown on the block, e.g. json, bash, .env',
    }),
    defineField({
      name: 'code',
      title: 'Code',
      type: 'text',
      rows: 8,
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { language: 'language', code: 'code' },
    prepare({ language, code }) {
      return {
        title: language ? `Code (${language})` : 'Code block',
        subtitle: (code || '').split('\n')[0]?.slice(0, 60),
      };
    },
  },
});

const callout = defineArrayMember({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      initialValue: 'info',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Warning', value: 'warn' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { tone: 'tone', text: 'text' },
    prepare({ tone, text }) {
      return {
        title: `${tone === 'warn' ? 'Warning' : 'Info'} callout`,
        subtitle: text,
      };
    },
  },
});

const docTable = defineArrayMember({
  name: 'docTable',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'headers',
      title: 'Column headers',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'docTableRow',
          title: 'Row',
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare({ cells }) {
              return { title: (cells || []).join('  |  ') || 'Empty row' };
            },
          },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { headers: 'headers', rows: 'rows' },
    prepare({ headers, rows }) {
      return {
        title: 'Table',
        subtitle: `${(headers || []).join(', ')} — ${(rows || []).length} row(s)`,
      };
    },
  },
});

/* Document -------------------------------------------------------------- */

export default defineType({
  name: 'docPage',
  title: 'Documentation page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'Stable slug matching the doc route, e.g. tad101-envelope',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      description: 'Top-level docs section this page belongs to',
      initialValue: 'business',
      options: {
        list: [
          { title: 'For Users', value: 'users' },
          { title: 'For Business', value: 'business' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      description:
        "Optional cluster key for a multi-page set sharing a sidebar, e.g. 'tad101'. Leave empty for standalone pages.",
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Sort order within its section / group (lower shows first)',
      initialValue: 0,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'Short lead / intro paragraph shown under the page title',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'string',
                    validation: (r) => r.required(),
                  }),
                ],
              },
            ],
          },
        }),
        codeBlock,
        callout,
        docTable,
      ],
    }),
  ],
  orderings: [
    {
      title: 'Section, then order',
      name: 'sectionOrder',
      by: [
        { field: 'section', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'title', section: 'section', group: 'group', order: 'order' },
    prepare({ title, section, group, order }) {
      const parts = [section, group].filter(Boolean).join(' / ');
      return {
        title,
        subtitle: `${parts}${parts ? ' · ' : ''}#${order ?? 0}`,
      };
    },
  },
});
