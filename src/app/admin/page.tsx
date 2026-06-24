import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortalOne } from '@/lib/admin-api';
import { type DashboardData, emptyDashboard } from '@/lib/portal-data';
import { DashboardCharts } from './dashboard-charts';

/* Admin dashboard — graphs from the platform aggregation endpoint. Server Component does the
   initial fetch (fast first paint + graceful empty state when the endpoint isn't deployed yet);
   the client wrapper handles the range toggle + refetch. Real data only — on any miss we pass the
   safe empty fallback and the client shows ONE friendly empty state, never fabricated charts. */

const INITIAL_DAYS = 30;

export default async function AdminDashboard() {
  const { data } = await fetchPortalOne<DashboardData>(`/admin/dashboard?days=${INITIAL_DAYS}`);
  const dashboard = data ?? emptyDashboard(INITIAL_DAYS);

  return (
    <>
      <PortalTopbar title="Admin" subtitle="Platform overview" />
      <DashboardCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
