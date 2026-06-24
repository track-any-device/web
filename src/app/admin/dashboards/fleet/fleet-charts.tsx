'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TrendArea, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from '../dashboard-section';

/* Fleet charts: devices onboarded over time + current device-status breakdown.
   (Protocol mix + signal-volume charts are planned for a later pass — the aggregation
   endpoint doesn't expose those fields yet, so they're intentionally omitted, not faked.) */

export function FleetCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  return (
    <DashboardSection
      initial={initial}
      initialDays={initialDays}
      stats={(d) => [
        { label: 'Devices', value: d.totals.devices },
        { label: 'Active devices', value: d.totals.activeDevices },
        { label: 'Pending devices', value: d.totals.pendingDevices },
      ]}
      emptyTitle="No fleet data yet"
      emptyBody="Once devices are onboarded, onboarding trends and the status breakdown will appear here."
    >
      {(d) => (
        <>
          <Card title="Devices onboarded" className="tad-charts-grid__full">
            <TrendArea data={d.timeseries.devicesOnboarded} name="Onboarded" color={CHART_COLORS.brand} />
          </Card>
          <Card title="Device status">
            <Donut data={d.distributions.deviceStatus.map((s) => ({ label: s.label, count: s.count }))} centerLabel="devices" />
          </Card>
          {/* TODO(later pass): protocol mix + signal-volume charts — need new aggregation fields. */}
        </>
      )}
    </DashboardSection>
  );
}
