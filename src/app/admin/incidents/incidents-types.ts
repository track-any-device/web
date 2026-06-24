/* Local types for the admin incidents view — match app's frozen contract exactly
   (consume as-is; the backend isn't deployed yet, so the UI degrades to empty states
   and never fabricates rows or coordinates). */

/** Row from GET /api/admin/incidents?days=N (LIST). */
export interface AdminIncidentRow {
  id: number | string;
  eventType: string | null;
  label: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info' | string | null;
  status: 'open' | 'acknowledged' | 'escalated' | 'resolved' | 'dismissed' | string | null;
  device: string | null; // imei
  openedAt: string | null;
  lat: number | null;
  lon: number | null;
  triggeredAt: string | null;
}

/** One archived track point from GET /api/admin/incidents/{id} (DETAIL). */
export interface AdminIncidentLocation {
  lat: number;
  lng: number;
  speed: number | null;
  at: string; // ISO8601
}

/** Full incident from GET /api/admin/incidents/{id} (DETAIL).
   locations[] is ordered oldest -> newest. */
export interface AdminIncidentDetail {
  id: number | string;
  eventType: string | null;
  label: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info' | string | null;
  status: 'open' | 'acknowledged' | 'escalated' | 'resolved' | 'dismissed' | string | null;
  level: string | null;
  triggeredAt: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  lat: number | null;
  lon: number | null;
  device: { id: number | string; imei: string | null; name: string | null } | null;
  locations: AdminIncidentLocation[];
}

export type DayWindow = 7 | 30 | 90;
