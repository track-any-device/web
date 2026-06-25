import Link from 'next/link';
import {
  PortableText,
  type PortableTextComponents,
} from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { AlertTriangle, Info } from 'lucide-react';
import { CopyButton } from './CopyButton';

/* ---------------------------------------------------------------------------
   Portable Text renderer for Sanity `docPage` bodies.

   Rendered inside a `.prose` <article> (see DocArticle), so headings,
   paragraphs, lists, links, inline code and tables inherit the existing docs
   prose styling (globals.css `.prose` + the TAD101 prose modifiers). The three
   custom object types — codeBlock, callout, docTable — get bespoke serializers
   that reproduce the look of the old hand-built CodeBlock / Callout / table.

   Custom type names handled (must match the schema exactly):
     - block      → styles normal/h2/h3/blockquote, lists bullet/number,
                    decorators strong/em/code, link annotation {href}
     - codeBlock  → { language?, code }
     - callout    → { tone: 'info'|'warn', text }
     - docTable   → { headers: string[], rows: [{ cells: string[] }] }
--------------------------------------------------------------------------- */

interface CodeBlockValue {
  _type: 'codeBlock';
  language?: string;
  code: string;
}
interface CalloutValue {
  _type: 'callout';
  tone?: 'info' | 'warn' | string;
  text: string;
}
interface DocTableValue {
  _type: 'docTable';
  headers: string[];
  rows: { _key?: string; cells?: string[] }[];
}

/** Code block with language label + copy button (matches tad101 CodeBlock). */
function DocCodeBlock({ value }: { value: CodeBlockValue }) {
  const { language, code } = value;
  return (
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{language || 'text'}</span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Callout / Note box (matches tad101 Callout; schema tone is info | warn). */
function DocCallout({ value }: { value: CalloutValue }) {
  const isWarn = value.tone === 'warn' || value.tone === 'warning';
  const cfg = isWarn
    ? { border: 'border-amber-200 dark:border-amber-900', bg: 'bg-amber-50/40 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', Icon: AlertTriangle }
    : { border: 'border-blue-200 dark:border-blue-900', bg: 'bg-blue-50/40 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', Icon: Info };
  const { Icon } = cfg;
  return (
    <div className={`not-prose my-4 flex gap-3 rounded-lg border px-4 py-3 text-sm ${cfg.border} ${cfg.bg}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${cfg.text}`} />
      <div className="leading-relaxed whitespace-pre-line text-foreground">{value.text}</div>
    </div>
  );
}

/** Styled HTML table from a docTable (headers + positional cells). */
function DocTable({ value }: { value: DocTableValue }) {
  const headers = value.headers ?? [];
  const rows = value.rows ?? [];
  return (
    <div className="not-prose my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row._key ?? ri}
              className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
            >
              {Array.from({ length: Math.max(headers.length, row.cells?.length ?? 0) }).map((_, ci) => (
                <td key={ci} className="px-3 py-2 align-middle text-muted-foreground">
                  {row.cells?.[ci] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Link annotation — internal /docs routes + in-page #anchors use next/link;
    external (http) and mailto open in a new tab / use a plain anchor. */
function DocLink({
  value,
  children,
}: {
  value?: { href?: string };
  children: React.ReactNode;
}) {
  const href = value?.href ?? '#';
  const isExternal = /^https?:\/\//i.test(href);
  const isMailto = href.startsWith('mailto:');
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    );
  }
  if (isMailto) {
    return (
      <a href={href} className="text-primary hover:underline">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="text-primary hover:underline">
      {children}
    </Link>
  );
}

const components: PortableTextComponents = {
  types: {
    codeBlock: ({ value }) => <DocCodeBlock value={value as CodeBlockValue} />,
    callout: ({ value }) => <DocCallout value={value as CalloutValue} />,
    docTable: ({ value }) => <DocTable value={value as DocTableValue} />,
  },
  block: {
    // headings carry an id derived from their text so #anchors (e.g.
    // #field-mapping) resolve to the right place.
    h2: ({ children }) => <h2 id={slugify(children)}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(children)}>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    normal: ({ children }) => <p>{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code>{children}</code>,
    link: DocLink,
  },
};

/** Best-effort heading slug (for in-page #anchor targets). */
function slugify(children: React.ReactNode): string {
  const text = extractText(children);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    // @ts-expect-error — children may be present on element-like nodes
    return extractText(node.props?.children);
  }
  return '';
}

export function DocBody({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}
