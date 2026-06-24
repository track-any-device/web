import React from 'react';
import { Card, Metric } from '@/components/ui';

/* Presentational data table + stat row for the internal portals. Server-component friendly —
   for row actions, add a column whose `render` returns a <Link>/<Button>. */

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  mono?: boolean;
  align?: 'left' | 'right' | 'center';
}

export function DataTable<T>({
  columns,
  rows,
  empty = 'Nothing here yet.',
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: React.ReactNode;
}) {
  return (
    // overflow:hidden on the card clips the rounded corners; the inner .tad-table-scroll provides
    // horizontal scroll so wide tables scroll WITHIN the card on phones instead of overflowing the
    // viewport. The desktop table is unchanged (it just never needs to scroll there).
    <div className="tad-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="tad-table-scroll">
        <table className="tad-table">
          <thead>
            <tr>{columns.map((c) => <th key={c.key} style={{ textAlign: c.align ?? 'left' }}>{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>{empty}</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={(row as { id?: React.Key }).id ?? i}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align ?? 'left', fontFamily: c.mono ? 'var(--font-mono)' : undefined }}>
                      {c.render ? c.render(row) : ((row as Record<string, React.ReactNode>)[c.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface Stat { label: string; value: React.ReactNode; hint?: string }

export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="tad-statrow">
      {stats.map((s, i) => (
        <Card key={i} style={{ padding: 'var(--space-5)' }}>
          <Metric label={s.label} value={s.value} />
          {s.hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.hint}</div>}
        </Card>
      ))}
    </div>
  );
}
