'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { MultiTrend, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from '../dashboard-section';

/* Operations charts: incidents opened vs resolved over time + current priority breakdown,
   with the MTTR (mean time-to-resolve) headline metric for resolved incidents in the window. */

/** Format MTTR hours for display: "—" when nothing resolved (0), else "Nh"/"Nd Nh". */
function formatMttr(hours: number): React.ReactNode {
  if (!hours || hours <= 0) return '—';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  if (hours < 48) return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours - days * 24);
  return rem ? `${days}d ${rem}h` : `${days}d`;
}

export function OperationsCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  return (
    <DashboardSection
      initial={initial}
      initialDays={initialDays}
      stats={(d) => [
        { label: 'Open incidents', value: d.totals.openIncidents },
        { label: 'Mean time-to-resolve', value: formatMttr(d.totals.mttrHours), hint: 'resolved in window' },
        { label: 'Active devices', value: d.totals.activeDevices },
        { label: 'Organisations', value: d.totals.organisations },
      ]}
      emptyTitle="No incident data yet"
      emptyBody="Once incidents are raised and worked, the opened-vs-resolved trend and priority mix will appear here."
    >
      {(d) => (
        <>
          <Card title="Incidents opened vs resolved" className="tad-charts-grid__full">
            <MultiTrend
              data={d.timeseries.incidents as unknown as Array<Record<string, string | number>>}
              series={[
                { key: 'opened', label: 'Opened', color: CHART_COLORS.danger },
                { key: 'resolved', label: 'Resolved', color: CHART_COLORS.ok },
              ]}
              variant="area"
            />
          </Card>
          <Card title="Incident priority">
            <Donut data={d.distributions.incidentPriority.map((s) => ({ label: s.label, count: s.count }))} centerLabel="incidents" />
          </Card>
        </>
      )}
    </DashboardSection>
  );
}
