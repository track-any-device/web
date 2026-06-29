/* Types + helpers matching app's /api/admin + /api/ops responses. No seed/fallback data:
   pages fetch real data from the API and render an empty state when there is none. */

export type Role = 'admin' | 'core' | 'procurement' | 'workshop' | 'delivery_order' | 'tenant_user' | 'user';

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', core: 'Core', procurement: 'Procurement', workshop: 'Workshop',
  delivery_order: 'Delivery Order', tenant_user: 'Tenant User', user: 'End User',
};

export const ADMIN_ROLES: Role[] = ['admin', 'core'];
export const OPS_ROLES: Role[] = ['admin', 'core', 'procurement', 'workshop', 'delivery_order'];

export interface Device {
  id: number | string; imei: string; model: string | null; sim: string | null;
  status: 'active' | 'blocked' | 'pending' | string; owner: string | null; lastSeen?: string | null;
  heartbeatAt?: string | null; heartbeatIntervalS?: number | null; online?: boolean;
  // present on /ops/devices
  broadcastId?: string | null; deviceTypeId?: number | string | null; gsm?: string | null;
  tenant?: { id: number | string; name: string; isDefault?: boolean } | null;
}

/** /api/ops/device-types row (Procurement add-device picker). */
export interface OpsDeviceType { id: number | string; name: string; slug: string }

/** /api/ops/pending-broadcasts row — auto-registered, broadcast-only devices awaiting a match. */
export interface PendingBroadcast {
  id: number | string; broadcastId: string | null; model: string | null; lastSeen: string | null;
}
export interface Tenant {
  id: number | string; name: string; slug: string;
  devices: number; members: number;
  hasKey?: boolean; lastUsed?: string | null; createdAt?: string | null;
  // true for the single public-tracker tenant; delete is blocked while set
  isDefault?: boolean;
  // present only on a create / rotate-key response — the plain key, shown once
  key?: string; tenantId?: number | string;
}
export interface TenantDeviceRow {
  id: number | string; imei: string | null; broadcastId: string | null;
  model: string | null; status: string | null; lastSeen: string | null;
  heartbeatAt?: string | null; heartbeatIntervalS?: number | null; online?: boolean;
}
export interface TenantDetail extends Omit<Tenant, 'devices'> {
  deviceCount: number; devices: TenantDeviceRow[];
}
/** /api/admin/tenants/{id}/members row — a user in the organisation's tenant_users pivot. */
export interface TenantMember {
  id: number | string; name: string; email: string | null;
  primary_contact: string | null; role: string | null; joinedAt: string | null;
}
export interface PortalUser {
  id: number | string; name: string; email: string; role: string; phone: string | null; verified: boolean;
  blocked?: boolean;
}
export interface DeviceType {
  id: number | string; name: string; slug: string; originalModel: string | null; pricePkr: number | null; active: boolean;
  deviceCount?: number;
  exclusionExempt?: boolean;
}

/** /api/admin/exclusion-beats row — a global no-go geofence. Every device is restricted
   by these unless its device type is exempt. */
export interface ExclusionBeat {
  id: number | string;
  name: string;
  description: string | null;
  color: string | null;
  geoFenceType: string | null;
  coordinates: { lat: number; lng: number }[];
  createdAt: string | null;
}

/** /api/admin/devices/{id} — full device view for the admin detail page. */
export interface AdminDeviceDetail {
  id: number | string; name: string | null; imei: string | null; sim: string | null; gsm: string | null;
  broadcastId: string | null; apnSettings: unknown; status: string | null;
  model: string | null; deviceTypeSlug: string | null;
  productSku: string | null; productName: string | null; speed: number | null;
  owner: { id: number | string; name: string; email: string } | null;
  tenant: { id: number | string; name: string; slug: string } | null;
  lastLat: number | null; lastLon: number | null; battery: number | null;
  lastSeen: string | null; lastSeenAt: string | null;
  heartbeatAt: string | null; heartbeatIntervalS: number | null; online: boolean;
  createdAt: string | null;
  incidents: { id: number | string; eventType: string | null; label?: string | null; priority: string | null; status: string | null; triggeredAt: string | null }[];
}
export interface Incident {
  id: number | string; eventType: string | null; priority: 'critical' | 'high' | 'medium' | 'low' | 'info' | string | null;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed' | 'escalated' | string | null;
  device: string | null; openedAt: string | null;
  /** Human label from the API — distinguishes an exclusion-zone breach from a normal beat exit
     (both share eventType 'beat_violation'). Falls back to eventLabel(eventType) when absent. */
  label?: string | null;
}
/** /api/ops/support/tickets/{id}/comments row — one note on a support ticket. */
export interface SupportTicketComment {
  id: number | string; body: string; user: string | null; at: string | null;
}

/** /api/ops/support/tickets row — a support ticket raised from an incident.
   `status` drives the Kanban column it appears in. `comments` is present only on the detail GET. */
export interface SupportTicket {
  id: number | string;
  status: 'open' | 'in_progress' | 'scheduled' | 'closed' | string;
  incidentId: number | string | null;
  eventType: string | null;
  label?: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info' | string | null;
  incidentStatus: string | null;
  triggeredAt: string | null;
  lat: number | null;
  lng: number | null;
  device: { id: number | string; name: string | null; imei: string | null } | null;
  customer: { name: string | null; phone: string | null } | null;
  assignee: { id: number | string; name: string | null } | null;
  commentsCount: number;
  scheduledFor: string | null;
  createdAt: string | null;
  comments?: SupportTicketComment[];
}

export interface DeliveryOrder {
  id: string; customer: string | null; phone: string | null; items: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | string | null;
  total?: number | null; currency?: string | null; placedAt: string | null;
}

/** /api/admin/sms/outgoing row — a queued/sent outbound SMS. */
export interface OutgoingSmsRow {
  id: number | string; to: string; message: string;
  status: 'pending' | 'sent' | 'failed' | string;
  attempts: number; source: string;
  sentAt: string | null; error: string | null; createdAt: string;
}

/** /api/admin/sms/incoming row — an inbound SMS received by the gateway. */
export interface IncomingSmsRow {
  id: number | string; from: string; message: string; source: string;
  receivedAt: string; processedAt: string | null; error: string | null;
}

export function eventLabel(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Admin dashboard aggregation (GET /api/admin/dashboard?days=N) ─────────
   Shape matches app's aggregation endpoint exactly. Every timeseries array is
   DENSE (one entry per UTC date in the window, zero-filled, ascending) and every
   distribution includes ALL enum cases even at count 0. Shared by the admin page
   (server fetch) and the BFF route handler. */
export interface DashboardRange { days: number; from: string; to: string }

export interface DashboardTotals {
  users: number; devices: number; activeDevices: number; pendingDevices: number;
  organisations: number; openIncidents: number; openTickets: number;
  forwarded24h: number; smsSent24h: number; smsReceived24h: number;
  /** Wave F — mean time-to-resolve (HOURS) of incidents resolved in the window, 2dp; 0 when none. */
  mttrHours: number;
}

export interface CountPoint { date: string; count: number }
export interface ForwardingPoint { date: string; delivered: number; failed: number }
export interface IncidentPoint { date: string; opened: number; resolved: number }
export interface SmsOutgoingPoint { date: string; sent: number; failed: number; pending: number }

export interface DashboardTimeseries {
  activity: CountPoint[];
  usersJoined: CountPoint[];
  devicesOnboarded: CountPoint[];
  tickets: CountPoint[];
  smsIncoming: CountPoint[];
  forwarding: ForwardingPoint[];
  incidents: IncidentPoint[];
  smsOutgoing: SmsOutgoingPoint[];
  /** Wave F — dense daily signal counts from InfluxDB (one CountPoint per UTC day in the
     window, ascending, zero-filled; all zeros when InfluxDB is disabled/unreachable). */
  signalVolume: CountPoint[];
}

export interface DistributionSlice { key: string; label: string; count: number }

export interface DashboardDistributions {
  userTypes: DistributionSlice[];
  deviceStatus: DistributionSlice[];
  ticketStatus: DistributionSlice[];
  incidentPriority: DistributionSlice[];
  /** Wave F — one slice per ACTIVE DeviceType (name asc); key = String(id), count = devices of
     that type. Length is dynamic (no fixed enum); empty when no active types. */
  deviceTypes: DistributionSlice[];
  /** Wave F — tenant forwarding-transport mix. ALWAYS the 4 fixed slices in this order
     (rest, mqtt, tad101, none), every case present even at 0. */
  transports: DistributionSlice[];
}

export interface DashboardData {
  range: DashboardRange;
  totals: DashboardTotals;
  timeseries: DashboardTimeseries;
  distributions: DashboardDistributions;
}

/** The 4 fixed forwarding-transport slices, in their canonical order, all at count 0.
   Matches app's `distributions.transports` contract exactly (every case always present). */
export function emptyTransportSlices(): DistributionSlice[] {
  return [
    { key: 'rest', label: 'REST API', count: 0 },
    { key: 'mqtt', label: 'MQTT', count: 0 },
    { key: 'tad101', label: 'TAD101 Channel', count: 0 },
    { key: 'none', label: 'None', count: 0 },
  ];
}

/** A dense, zero-filled CountPoint[] of length `days`: one entry per UTC day, ASCENDING,
   ending today (last date === today UTC). Mirrors the dense signalVolume the API returns so the
   empty fallback is shaped identically (never absent, never sparse). */
export function denseZeroCountPoints(days: number): CountPoint[] {
  const n = Math.max(0, Math.trunc(days));
  const out: CountPoint[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return out;
}

/** Safe empty fallback — used when the endpoint 404s (not yet deployed) or errors.
   Totals all zero + every series empty => the UI shows ONE friendly empty state,
   never fabricated chart data. */
export function emptyDashboard(days = 30): DashboardData {
  return {
    range: { days, from: '', to: '' },
    totals: {
      users: 0, devices: 0, activeDevices: 0, pendingDevices: 0,
      organisations: 0, openIncidents: 0, openTickets: 0,
      forwarded24h: 0, smsSent24h: 0, smsReceived24h: 0,
      mttrHours: 0,
    },
    timeseries: {
      activity: [], usersJoined: [], devicesOnboarded: [], tickets: [],
      smsIncoming: [], forwarding: [], incidents: [], smsOutgoing: [],
      // Dense zero-filled, matching the API's signalVolume shape (never sparse/absent).
      signalVolume: denseZeroCountPoints(days),
    },
    distributions: {
      userTypes: [], deviceStatus: [], ticketStatus: [], incidentPriority: [],
      deviceTypes: [], transports: emptyTransportSlices(),
    },
  };
}

/** True when the payload carries no real data (every total 0 AND every series empty).
   Drives the single empty state instead of a wall of flat charts. */
export function isDashboardEmpty(d: DashboardData): boolean {
  const t = d.totals;
  const totalsZero =
    t.users === 0 && t.devices === 0 && t.activeDevices === 0 && t.pendingDevices === 0 &&
    t.organisations === 0 && t.openIncidents === 0 && t.openTickets === 0 &&
    t.forwarded24h === 0 && t.smsSent24h === 0 && t.smsReceived24h === 0 &&
    t.mttrHours === 0;
  const ts = d.timeseries;
  // signalVolume is always DENSE (length === days even when empty), so length can't signal
  // emptiness — only a non-zero count means it carries real data.
  const signalVolumeEmpty = !ts.signalVolume.some((p) => p.count > 0);
  const seriesEmpty =
    ts.activity.length === 0 && ts.usersJoined.length === 0 && ts.devicesOnboarded.length === 0 &&
    ts.tickets.length === 0 && ts.smsIncoming.length === 0 && ts.forwarding.length === 0 &&
    ts.incidents.length === 0 && ts.smsOutgoing.length === 0 && signalVolumeEmpty;
  return totalsZero && seriesEmpty;
}

/* ── Per-portal access (operations) ───────────────────────────────────────
   Each operations portal is gated to specific roles. Admin/Core can access all;
   each operations role sees only its own portal. */
export const PORTAL_ROLES: Record<string, Role[]> = {
  support: ['admin', 'core'],
  procurement: ['admin', 'core', 'procurement'],
  workshop: ['admin', 'core', 'workshop'],
  orders: ['admin', 'core', 'delivery_order'],
};

export function canAccessPortal(role: string, portal: string): boolean {
  return (PORTAL_ROLES[portal] ?? []).includes(role as Role);
}

/** Operations portals (in nav order) the given role may access. */
export function accessiblePortals(role: string): string[] {
  return Object.keys(PORTAL_ROLES).filter((p) => canAccessPortal(role, p));
}
