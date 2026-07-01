'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { TrendArea, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from '../dashboard-section';

/* Support charts: support tickets raised over time + current ticket-status breakdown. */

export function SupportCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  return (
    <DashboardSection
      initial={initial}
      initialDays={initialDays}
      stats={(d) => [
        { label: 'Open tickets', value: d.totals.openTickets },
        { label: 'Open alerts', value: d.totals.openIncidents },
      ]}
      emptyTitle="No support data yet"
      emptyBody="Once support tickets are raised, the volume trend and status breakdown will appear here."
    >
      {(d) => (
        <>
          <Card title="Support tickets" className="tad-charts-grid__full">
            <TrendArea data={d.timeseries.tickets} name="Tickets" color={CHART_COLORS.violet} />
          </Card>
          <Card title="Ticket status">
            <Donut data={d.distributions.ticketStatus.map((s) => ({ label: s.label, count: s.count }))} centerLabel="tickets" />
          </Card>
        </>
      )}
    </DashboardSection>
  );
}
