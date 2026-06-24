import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchDashboard, INITIAL_DAYS } from '../fetch-dashboard';
import { IntegrationsCharts } from './integrations-charts';

/* Integrations & Comms dashboard — signal forwarding + outbound/inbound SMS. */

export default async function IntegrationsDashboard() {
  const dashboard = await fetchDashboard(INITIAL_DAYS);
  return (
    <>
      <PortalTopbar title="Integrations & Comms" subtitle="Signal forwarding & SMS traffic" />
      <IntegrationsCharts initial={dashboard} initialDays={INITIAL_DAYS} />
    </>
  );
}
