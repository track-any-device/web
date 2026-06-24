import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchDashboard, INITIAL_DAYS } from '../fetch-dashboard';
import { SupportCharts } from './support-charts';

/* Support dashboard — support tickets over time + ticket status mix. */

export default async function SupportDashboard() {
  const dashboard = await fetchDashboard(INITIAL_DAYS);
  return (
    <>
      <PortalTopbar title="Support" subtitle="Tickets raised & status" />
      <SupportCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
