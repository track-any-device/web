'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TrendArea, MultiTrend, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from '../dashboard-section';

/* Integrations & Comms charts: signals forwarded (delivered/failed), SMS sent
   (sent/failed/pending) and SMS received over time. */

export function IntegrationsCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  return (
    <DashboardSection
      initial={initial}
      initialDays={initialDays}
      stats={(d) => [
        { label: 'Forwarded 24h', value: d.totals.forwarded24h },
        { label: 'SMS sent 24h', value: d.totals.smsSent24h },
        { label: 'SMS received 24h', value: d.totals.smsReceived24h },
      ]}
      emptyTitle="No traffic data yet"
      emptyBody="Once signals are forwarded and SMS traffic flows, the delivery and volume trends will appear here."
    >
      {(d) => (
        <>
          <Card title="Signals forwarded" className="tad-charts-grid__full">
            <MultiTrend
              data={d.timeseries.forwarding as unknown as Array<Record<string, string | number>>}
              series={[
                { key: 'delivered', label: 'Delivered', color: CHART_COLORS.ok },
                { key: 'failed', label: 'Failed', color: CHART_COLORS.danger },
              ]}
              variant="area"
              stacked
            />
          </Card>
          <Card title="SMS sent">
            <MultiTrend
              data={d.timeseries.smsOutgoing as unknown as Array<Record<string, string | number>>}
              series={[
                { key: 'sent', label: 'Sent', color: CHART_COLORS.ok },
                { key: 'failed', label: 'Failed', color: CHART_COLORS.danger },
                { key: 'pending', label: 'Pending', color: CHART_COLORS.warn },
              ]}
              variant="bar"
              stacked
            />
          </Card>
          <Card title="SMS received">
            <TrendArea data={d.timeseries.smsIncoming} name="Received" color={CHART_COLORS.blue} />
          </Card>
          <Card title="Forwarding transports">
            <Donut data={d.distributions.transports.map((s) => ({ label: s.label, count: s.count }))} centerLabel="tenants" />
          </Card>
        </>
      )}
    </DashboardSection>
  );
}
