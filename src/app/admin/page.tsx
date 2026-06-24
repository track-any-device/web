import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchDashboard, INITIAL_DAYS } from './dashboards/fetch-dashboard';
import { OverviewCharts } from './dashboards/overview-charts';

/* Admin Overview — the landing dashboard. Server Component does the initial fetch (fast first
   paint + graceful empty state when the aggregation endpoint isn't deployed yet); the client
   section handles the range toggle + refetch and drill-down into the five focused dashboards.
   Real data only — on any miss we pass the safe empty fallback and the client shows ONE friendly
   empty state, never fabricated charts. */

export default async function AdminDashboard() {
  const dashboard = await fetchDashboard(INITIAL_DAYS);
  return (
    <>
      <PortalTopbar title="Admin" subtitle="Platform overview" />
      <OverviewCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
