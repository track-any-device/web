import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchDashboard, INITIAL_DAYS } from '../fetch-dashboard';
import { CustomersCharts } from './customers-charts';

/* Customers dashboard — users joined over time + user-type mix. */

export default async function CustomersDashboard() {
  const dashboard = await fetchDashboard(INITIAL_DAYS);
  return (
    <>
      <PortalTopbar title="Customers" subtitle="Users joined & types" />
      <CustomersCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
