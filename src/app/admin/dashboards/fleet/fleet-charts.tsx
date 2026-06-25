'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TrendArea, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from '../dashboard-section';

/* Fleet charts: devices onboarded over time + signal volume (telemetry) over time +
   current device-status breakdown + active device-type mix. signalVolume is dense daily
   InfluxDB counts (zero-filled / all-zero when InfluxDB is off — never fabricated). */

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
          <Card title="Signal volume" className="tad-charts-grid__full">
            <TrendArea data={d.timeseries.signalVolume} name="Signals" color={CHART_COLORS.blue} />
          </Card>
          <Card title="Device status">
            <Donut data={d.distributions.deviceStatus.map((s) => ({ label: s.label, count: s.count }))} centerLabel="devices" />
          </Card>
          <Card title="Device types">
            <Donut data={d.distributions.deviceTypes.map((s) => ({ label: s.label, count: s.count }))} centerLabel="devices" />
          </Card>
        </>
      )}
    </DashboardSection>
  );
}
