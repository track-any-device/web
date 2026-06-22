/* Types matching app's /api/admin + /api/ops responses, with representative fallback data
   (used by fetchPortal when there's no session / the API is unreachable). */

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
}
export interface Tenant {
  id: number | string; name: string; slug: string;
  status: 'approved' | 'pending' | 'rejected' | string; devices: number; members: number;
}
export interface PortalUser {
  id: number | string; name: string; email: string; role: string; phone: string | null; verified: boolean;
}
export interface DeviceType {
  id: number | string; name: string; slug: string; originalModel: string | null; pricePkr: number | null; active: boolean;
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

export const DEVICES: Device[] = [
  { id: 1, imei: '352016901234567', model: 'Concox GT06N', sim: '+923001234567', status: 'active', owner: 'Ali Raza', lastSeen: '2 min ago' },
  { id: 2, imei: '352016907654321', model: 'Wanwaytech G18', sim: '+923019876543', status: 'active', owner: 'Sana Malik', lastSeen: '5 min ago' },
  { id: 3, imei: '868120304050607', model: 'Gosafe G1C', sim: null, status: 'pending', owner: null, lastSeen: null },
  { id: 4, imei: '868120307080910', model: 'Concox VL103', sim: '+923331112233', status: 'active', owner: 'Bilal Ahmed', lastSeen: '1 min ago' },
  { id: 5, imei: '359998801112223', model: 'Teltonika TMT250', sim: null, status: 'pending', owner: null, lastSeen: null },
  { id: 6, imei: '352016905556667', model: 'Concox GT06N', sim: '+923214445556', status: 'blocked', owner: 'Hina Tariq', lastSeen: '3 days ago' },
];

export const TENANTS: Tenant[] = [
  { id: 1, name: 'Acme Logistics', slug: 'acme', status: 'approved', devices: 42, members: 6 },
  { id: 2, name: 'Pak Couriers', slug: 'pak-couriers', status: 'approved', devices: 88, members: 11 },
  { id: 3, name: 'Northern Transport', slug: 'northern', status: 'pending', devices: 0, members: 1 },
];

export const USERS: PortalUser[] = [
  { id: 1, name: 'Ayesha Khan', email: 'ayesha@track-any-device.com', role: 'admin', phone: '+923001112233', verified: true },
  { id: 2, name: 'Omar Farooq', email: 'omar@track-any-device.com', role: 'core', phone: '+923004445566', verified: true },
  { id: 3, name: 'Zara Sheikh', email: 'zara@track-any-device.com', role: 'procurement', phone: '+923007778899', verified: true },
  { id: 4, name: 'Hassan Ali', email: 'hassan@track-any-device.com', role: 'workshop', phone: '+923002223344', verified: true },
  { id: 5, name: 'Ali Raza', email: 'ali.raza@gmail.com', role: 'user', phone: '+923001234567', verified: true },
  { id: 6, name: 'Acme Logistics', email: 'ops@acme.pk', role: 'tenant_user', phone: '+923211234567', verified: true },
];

export const DEVICE_TYPES: DeviceType[] = [
  { id: 1, name: 'Concox GT06N', slug: 'concox-gt06n', originalModel: 'gt06', pricePkr: 6500, active: true },
  { id: 2, name: 'Wanwaytech G18', slug: 'wanwaytech-g18', originalModel: 'gt06', pricePkr: 7200, active: true },
  { id: 3, name: 'Gosafe G1C', slug: 'gosafe-g1c', originalModel: 'gt06', pricePkr: 5400, active: true },
  { id: 4, name: 'Concox VL103', slug: 'concox-vl103', originalModel: 'gt06', pricePkr: 5900, active: true },
  { id: 5, name: 'Teltonika TMT250', slug: 'teltonika-tmt250', originalModel: 'p901', pricePkr: 9800, active: true },
];

export const INCIDENTS: Incident[] = [
  { id: 'INC-1042', eventType: 'sos', priority: 'critical', status: 'open', device: '352016901234567', openedAt: '4 min ago' },
  { id: 'INC-1041', eventType: 'geofence_exit', priority: 'high', status: 'acknowledged', device: '868120307080910', openedAt: '22 min ago' },
  { id: 'INC-1040', eventType: 'low_battery', priority: 'medium', status: 'open', device: '352016907654321', openedAt: '1 hr ago' },
  { id: 'INC-1039', eventType: 'idle_too_long', priority: 'low', status: 'resolved', device: '352016905556667', openedAt: '3 hr ago' },
];

export const ORDERS: DeliveryOrder[] = [
  { id: 'TAD-20490', customer: 'Usman Sheikh', phone: '+923002223344', items: 2, status: 'pending', total: 13000, currency: 'PKR', placedAt: 'Today, 09:12' },
  { id: 'TAD-20489', customer: 'Sana Malik', phone: '+923019876543', items: 3, status: 'confirmed', total: 19500, currency: 'PKR', placedAt: 'Today, 08:40' },
  { id: 'TAD-20488', customer: 'Ali Raza', phone: '+923001234567', items: 1, status: 'delivered', total: 6500, currency: 'PKR', placedAt: 'Yesterday' },
];

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
