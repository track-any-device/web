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
export interface PortalUser {
  id: number | string; name: string; email: string; role: string; phone: string | null; verified: boolean;
  blocked?: boolean;
}
export interface DeviceType {
  id: number | string; name: string; slug: string; originalModel: string | null; pricePkr: number | null; active: boolean;
  deviceCount?: number;
}

/** /api/admin/devices/{id} — full device view for the admin detail page. */
export interface AdminDeviceDetail {
  id: number | string; name: string | null; imei: string | null; sim: string | null; gsm: string | null;
  broadcastId: string | null; apnSettings: unknown; status: string | null;
  model: string | null; deviceTypeSlug: string | null;
  owner: { id: number | string; name: string; email: string } | null;
  tenant: { id: number | string; name: string; slug: string } | null;
  lastLat: number | null; lastLon: number | null; battery: number | null;
  lastSeen: string | null; lastSeenAt: string | null;
  heartbeatAt: string | null; heartbeatIntervalS: number | null; online: boolean;
  createdAt: string | null;
  incidents: { id: number | string; eventType: string | null; priority: string | null; status: string | null; triggeredAt: string | null }[];
}
export interface Incident {
  id: number | string; eventType: string | null; priority: 'critical' | 'high' | 'medium' | 'low' | 'info' | string | null;
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed' | 'escalated' | string | null;
  device: string | null; openedAt: string | null;
}
export interface DeliveryOrder {
  id: string; customer: string | null; phone: string | null; items: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | string | null;
  total?: number | null; currency?: string | null; placedAt: string | null;
}

export function eventLabel(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
