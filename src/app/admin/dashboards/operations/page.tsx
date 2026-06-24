import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchDashboard, INITIAL_DAYS } from '../fetch-dashboard';
import { OperationsCharts } from './operations-charts';

/* Operations dashboard — incidents opened vs resolved + incident priority mix. */

export default async function OperationsDashboard() {
  const dashboard = await fetchDashboard(INITIAL_DAYS);
  return (
    <>
      <PortalTopbar title="Operations" subtitle="Incidents opened, resolved & priority" />
      <OperationsCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
