import React from 'react';
import { Metric } from '@/components/ui';
import { Section } from '@/components/tad/marketing';
import type { StatsBandData } from '@/lib/pages';

/* Stats band — a responsive row of figures. Reuses the design-system Metric (value + label). */
export function StatsBand({ title, stats }: StatsBandData) {
  const items = (stats ?? []).filter((s) => s?.value || s?.label);
  if (items.length === 0) return null;

  const cols = Math.min(items.length, 4);
  const gridCols =
    cols >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4'
    : cols === 3 ? 'sm:grid-cols-3'
    : cols === 2 ? 'sm:grid-cols-2'
    : 'sm:grid-cols-1';

  return (
    <Section title={title} width="lg">
      <div className={`grid grid-cols-1 gap-6 ${gridCols}`}>
        {items.map((s, i) => (
          <Metric key={i} value={s.value ?? ''} label={s.label ?? ''} />
        ))}
      </div>
    </Section>
  );
}
