import { cn } from '@/lib/cn';

/* Prose wrapper for Sanity-rendered doc bodies. Matches the TAD101 layout's
   `<article className="prose …">` styling so standalone pages (user-manual,
   forwarding) and the TAD101 cluster share one look. */
export const DOC_PROSE_CLASS = cn(
  'prose max-w-none prose-neutral dark:prose-invert',
  'prose-headings:font-semibold prose-headings:tracking-tight',
  'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
  'prose-strong:text-foreground',
  'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.875em] prose-code:font-medium prose-code:text-foreground prose-code:before:hidden prose-code:after:hidden',
  'prose-table:my-4 prose-table:text-sm',
  'prose-th:border-b prose-th:border-border prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-th:text-left',
  'prose-td:border-b prose-td:border-border prose-td:px-3 prose-td:py-2',
);

export function DocArticle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <article className={cn(DOC_PROSE_CLASS, className)}>{children}</article>;
}
