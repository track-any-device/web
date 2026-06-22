/* Representative placeholder data for the internal portals (operations + admin).
   Wire to app's REST API (/api/admin/*, /api/ops/*) when those endpoints land — the page
   components read from here so the swap is a one-line data-source change per page. */

export type DeviceStatus = 'active' | 'blocked' | 'pending';
export type OrderStatus = 'packing' | 'dispatched' | 'delivered';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Device {
  id: string;
  imei: string;
  model: string;          // device type name
  category: 'car' | 'bike' | 'person';
  sim: string | null;
  status: DeviceStatus;
  owner: string | null;
  lastSeen: string | null;
  deliveryOrder: string | null;
}

export interface DeliveryOrder {
  id: string;             // claim code / DO number
  customer: string;
  phone: string;
  items: number;
  city: string;
  status: OrderStatus;
  placedAt: string;
}

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  type: string;
  device: string;         // imei
  customer: string;
  location: string;
  openedAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Core' | 'Procurement' | 'Workshop' | 'DeliveryOrder' | 'TenantUser' | 'User';
  phone: string;
  verified: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'approved' | 'pending' | 'rejected';
  devices: number;
  members: number;
}

export interface DeviceType {
  id: string;
  name: string;
  slug: string;
  originalModel: string;
  category: 'car' | 'bike' | 'person';
  protocol: 'GT06' | 'JT808' | 'TAD101';
  pricePkr: number;
  active: boolean;
}

export const DEVICES: Device[] = [
  { id: 'd1', imei: '352016901234567', model: 'Concox GT06N', category: 'car', sim: '+923001234567', status: 'active', owner: 'Ali Raza', lastSeen: '2 min ago', deliveryOrder: 'TAD-20488' },
  { id: 'd2', imei: '352016907654321', model: 'Wanwaytech G18', category: 'car', sim: '+923019876543', status: 'active', owner: 'Sana Malik', lastSeen: '5 min ago', deliveryOrder: 'TAD-20489' },
  { id: 'd3', imei: '868120304050607', model: 'Gosafe G1C', category: 'bike', sim: null, status: 'pending', owner: null, lastSeen: null, deliveryOrder: 'TAD-20490' },
  { id: 'd4', imei: '868120307080910', model: 'Concox VL103', category: 'bike', sim: '+923331112233', status: 'active', owner: 'Bilal Ahmed', lastSeen: '1 min ago', deliveryOrder: 'TAD-20489' },
  { id: 'd5', imei: '359998801112223', model: 'Teltonika TMT250', category: 'person', sim: null, status: 'pending', owner: null, lastSeen: null, deliveryOrder: null },
  { id: 'd6', imei: '352016905556667', model: 'Concox GT06N', category: 'car', sim: '+923214445556', status: 'blocked', owner: 'Hina Tariq', lastSeen: '3 days ago', deliveryOrder: 'TAD-20475' },
];

export const ORDERS: DeliveryOrder[] = [
  { id: 'TAD-20490', customer: 'Usman Sheikh', phone: '+923002223344', items: 2, city: 'Lahore', status: 'packing', placedAt: 'Today, 09:12' },
  { id: 'TAD-20489', customer: 'Sana Malik', phone: '+923019876543', items: 3, city: 'Karachi', status: 'dispatched', placedAt: 'Today, 08:40' },
  { id: 'TAD-20488', customer: 'Ali Raza', phone: '+923001234567', items: 1, city: 'Islamabad', status: 'delivered', placedAt: 'Yesterday' },
  { id: 'TAD-20487', customer: 'Fatima Noor', phone: '+923451239876', items: 1, city: 'Rawalpindi', status: 'delivered', placedAt: 'Yesterday' },
];

export const INCIDENTS: Incident[] = [
  { id: 'INC-1042', severity: 'critical', type: 'Tow-away alert', device: '352016901234567', customer: 'Ali Raza', location: 'Gulberg, Lahore', openedAt: '4 min ago', status: 'open' },
  { id: 'INC-1041', severity: 'high', type: 'Geofence exit', device: '868120307080910', customer: 'Bilal Ahmed', location: 'DHA, Karachi', openedAt: '22 min ago', status: 'acknowledged' },
  { id: 'INC-1040', severity: 'medium', type: 'Low battery', device: '352016907654321', customer: 'Sana Malik', location: 'Clifton, Karachi', openedAt: '1 hr ago', status: 'open' },
  { id: 'INC-1039', severity: 'low', type: 'Idle too long', device: '352016905556667', customer: 'Hina Tariq', location: 'F-7, Islamabad', openedAt: '3 hr ago', status: 'resolved' },
];

export const USERS: PortalUser[] = [
  { id: 'u1', name: 'Ayesha Khan', email: 'ayesha@track-any-device.com', role: 'Admin', phone: '+923001112233', verified: true },
  { id: 'u2', name: 'Omar Farooq', email: 'omar@track-any-device.com', role: 'Core', phone: '+923004445566', verified: true },
  { id: 'u3', name: 'Zara Sheikh', email: 'zara@track-any-device.com', role: 'Procurement', phone: '+923007778899', verified: true },
  { id: 'u4', name: 'Hassan Ali', email: 'hassan@track-any-device.com', role: 'Workshop', phone: '+923002223344', verified: true },
  { id: 'u5', name: 'Ali Raza', email: 'ali.raza@gmail.com', role: 'User', phone: '+923001234567', verified: true },
  { id: 'u6', name: 'Acme Logistics', email: 'ops@acme.pk', role: 'TenantUser', phone: '+923211234567', verified: true },
];

export const TENANTS: Tenant[] = [
  { id: 't1', name: 'Acme Logistics', slug: 'acme', status: 'approved', devices: 42, members: 6 },
  { id: 't2', name: 'Pak Couriers', slug: 'pak-couriers', status: 'approved', devices: 88, members: 11 },
  { id: 't3', name: 'Northern Transport', slug: 'northern', status: 'pending', devices: 0, members: 1 },
];

export const DEVICE_TYPES: DeviceType[] = [
  { id: 'dt1', name: 'Concox GT06N', slug: 'concox-gt06n', originalModel: 'gt06', category: 'car', protocol: 'GT06', pricePkr: 6500, active: true },
  { id: 'dt2', name: 'Wanwaytech G18', slug: 'wanwaytech-g18', originalModel: 'gt06', category: 'car', protocol: 'GT06', pricePkr: 7200, active: true },
  { id: 'dt3', name: 'Gosafe G1C', slug: 'gosafe-g1c', originalModel: 'gt06', category: 'bike', protocol: 'GT06', pricePkr: 5400, active: true },
  { id: 'dt4', name: 'Concox VL103', slug: 'concox-vl103', originalModel: 'gt06', category: 'bike', protocol: 'GT06', pricePkr: 5900, active: true },
  { id: 'dt5', name: 'Teltonika TMT250', slug: 'teltonika-tmt250', originalModel: 'p901', category: 'person', protocol: 'JT808', pricePkr: 9800, active: true },
];
