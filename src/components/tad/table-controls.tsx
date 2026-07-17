'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import type { PortalMeta } from '@/lib/admin-api';

/* URL-driven controls for server-paginated portal tables. TableSearch writes ?search=,
   TablePager writes ?page= — the server component re-fetches with those params, so the
   browser never holds more than one page of rows. */

function useParamNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );
}

export function TableSearch({ placeholder = 'Search…' }: { placeholder?: string }) {
  const navigate = useParamNavigate();
  const searchParams = useSearchParams();
  const [term, setTerm] = React.useState(searchParams.get('search') ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ search: term.trim() || null, page: null });
      }}
      style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 360 }}
    >
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      <Button type="submit" variant="secondary" size="sm" aria-label="Run search">
        <Search className="w-4 h-4" />
      </Button>
    </form>
  );
}

/** first / prev-gap / current±2 / next-gap / last — at most 9 numbered buttons. */
function windowedPages(current: number, last: number): (number | 'gap')[] {
  if (last <= 9) return Array.from({ length: last }, (_, i) => i + 1);

  const wanted = new Set<number>([1, last]);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= last) wanted.add(p);
  }

  const items: (number | 'gap')[] = [];
  let prev = 0;
  for (const p of [...wanted].sort((a, b) => a - b)) {
    if (prev !== 0 && p - prev > 1) items.push('gap');
    items.push(p);
    prev = p;
  }
  return items;
}

export function TablePager({ meta }: { meta: PortalMeta | null }) {
  const navigate = useParamNavigate();

  if (!meta || meta.last_page <= 1) return null;

  const go = (page: number) => navigate({ page: page === 1 ? null : String(page) });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
      <Button variant="ghost" size="sm" disabled={meta.current_page <= 1} onClick={() => go(meta.current_page - 1)}>
        ‹
      </Button>
      {windowedPages(meta.current_page, meta.last_page).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span>
        ) : (
          <Button
            key={item}
            variant={item === meta.current_page ? 'primary' : 'ghost'}
            size="sm"
            aria-current={item === meta.current_page ? 'page' : undefined}
            onClick={() => go(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button variant="ghost" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => go(meta.current_page + 1)}>
        ›
      </Button>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
        {meta.total.toLocaleString()} total
      </span>
    </div>
  );
}
