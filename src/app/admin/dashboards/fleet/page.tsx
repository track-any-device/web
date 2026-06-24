import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchDashboard, INITIAL_DAYS } from '../fetch-dashboard';
import { FleetCharts } from './fleet-charts';

/* Fleet dashboard — device onboarding + status. Server Component does the initial fetch
   (fast first paint + graceful empty fallback); the client section handles the range toggle. */

export default async function FleetDashboard() {
  const dashboard = await fetchDashboard(INITIAL_DAYS);
  return (
    <>
      <PortalTopbar title="Fleet" subtitle="Devices onboarded & status" />
      <FleetCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
