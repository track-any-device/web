'use client';

import React from 'react';
import { Card, Tabs } from '@/components/ui';
import { StatRow, type Stat } from '@/components/tad/data-table';
import { type DashboardData, isDashboardEmpty, emptyDashboard } from '@/lib/portal-data';

/* Shared client scaffold for every admin dashboard (Overview + the five child pages).
   Seeds from the server-fetched payload for a fast first paint, then refetches the BFF
   (/api/admin/dashboard?days=N) when the 7/30/90-day range toggles — exactly the pattern the
   old single dashboard-charts.tsx used, factored out so each page is a thin composition.

   Real data only: when the live payload is the empty fallback we render ONE friendly empty
   state (per page) instead of a wall of flat charts; in dev we also surface the API reason. */

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const DEV = process.env.NODE_ENV !== 'production';

export interface DashboardSectionProps {
  initial: DashboardData;
  initialDays: number;
  /** Headline totals shown at the top of the page (relevant to that dashboard). */
  stats: (d: DashboardData) => Stat[];
  /** Short copy for this page's empty state. */
  emptyTitle?: string;
  emptyBody?: string;
  /** Charts for this page — receives the live (range-aware) payload. */
  children: (d: DashboardData) => React.ReactNode;
}

export function DashboardSection({
  initial,
  initialDays,
  stats,
  emptyTitle = 'No activity data yet',
  emptyBody = 'Once the platform records activity, the trends and breakdowns will appear here.',
  children,
}: DashboardSectionProps) {
  const [days, setDays] = React.useState(initialDays);
  const [data, setData] = React.useState<DashboardData>(initial);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onRange = React.useCallback(
    async (next: number) => {
      if (next === days) return;
      setDays(next);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/dashboard?days=${next}`, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          setData(emptyDashboard(next));
          setError(DEV ? `Dashboard API responded ${res.status}.` : null);
          return;
        }
        const body = (await res.json()) as DashboardData;
        setData(body);
      } catch (e) {
        setData(emptyDashboard(next));
        setError(DEV ? `Dashboard request failed: ${(e as Error).message}` : null);
      } finally {
        setLoading(false);
      }
    },
    [days],
  );

  const empty = isDashboardEmpty(data);

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {data.range.from && data.range.to ? `${data.range.from} → ${data.range.to} (UTC)` : `Last ${days} days`}
          {loading && <span style={{ marginLeft: 8 }}>· updating…</span>}
        </div>
        <Tabs variant="pill" items={RANGES} value={String(days)} onChange={(v) => onRange(Number(v))} />
      </div>

      <StatRow stats={stats(data)} />

      {empty ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', display: 'grid', gap: 8, justifyItems: 'center' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>{emptyTitle}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420 }}>{emptyBody}</div>
            {DEV && error && (
              <div style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>{error}</div>
            )}
          </div>
        </Card>
      ) : (
        <div className="tad-charts-grid">{children(data)}</div>
      )}
    </div>
  );
}
