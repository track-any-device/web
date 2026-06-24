import { fetchPortalOne } from '@/lib/admin-api';
import { type DashboardData, emptyDashboard } from '@/lib/portal-data';

/* Shared server fetch for the admin dashboards. Every dashboard page (Overview + the five
   child pages) does the same initial server-side fetch of the platform aggregation endpoint,
   falling back to the safe empty payload on any miss (endpoint not deployed / 404 / error) so
   the client renders a graceful empty state rather than fabricated charts. */

export const INITIAL_DAYS = 30;

export async function fetchDashboard(days = INITIAL_DAYS): Promise<DashboardData> {
  const { data } = await fetchPortalOne<DashboardData>(`/admin/dashboard?days=${days}`);
  return data ?? emptyDashboard(days);
}
