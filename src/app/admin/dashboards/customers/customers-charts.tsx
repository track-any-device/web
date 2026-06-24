'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TrendArea, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from '../dashboard-section';

/* Customers charts: users joined over time + current user-type breakdown. */

export function CustomersCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  return (
    <DashboardSection
      initial={initial}
      initialDays={initialDays}
      stats={(d) => [
        { label: 'Users', value: d.totals.users },
        { label: 'Organisations', value: d.totals.organisations },
      ]}
      emptyTitle="No customer data yet"
      emptyBody="Once users join the platform, the sign-up trend and user-type breakdown will appear here."
    >
      {(d) => (
        <>
          <Card title="Users joined" className="tad-charts-grid__full">
            <TrendArea data={d.timeseries.usersJoined} name="Joined" color={CHART_COLORS.blue} />
          </Card>
          <Card title="User types">
            <Donut data={d.distributions.userTypes.map((s) => ({ label: s.label, count: s.count }))} centerLabel="users" />
          </Card>
        </>
      )}
    </DashboardSection>
  );
}
