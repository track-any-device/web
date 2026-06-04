/**
 * REST API client for the central app/ My Portal API.
 *
 * All calls require a Passport bearer token (the user's SSO access token).
 * Token is read from the tad_session cookie via getSession() in server components.
 */

const API_URL = process.env.API_URL ?? 'https://api.track-any-device.com';

export class ApiClient {
    constructor(private token: string) {}

    private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(`${API_URL}/api/my${path}`);
        if (params) {
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        }
        const res = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept':        'application/json',
            },
            next: { revalidate: 0 },
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`API ${res.status} ${path}: ${body.slice(0, 200)}`);
        }
        return res.json() as Promise<T>;
    }

    private async patch<T>(path: string, body: unknown): Promise<T> {
        const res = await fetch(`${API_URL}/api/my${path}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type':  'application/json',
                'Accept':        'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`API ${res.status} ${path}: ${text.slice(0, 200)}`);
        }
        return res.json() as Promise<T>;
    }

    async dashboard() {
        return this.get<{
            device_count: number;
            order_count:  number;
            tenant_count: number;
            open_incidents: Incident[];
        }>('/dashboard');
    }

    async devices(params?: Record<string, string>) {
        return this.get<Paginated<Device>>('/devices', params);
    }

    async device(id: number) {
        return this.get<Device>(`/devices/${id}`);
    }

    async incidents(params?: Record<string, string>) {
        return this.get<Paginated<Incident>>('/incidents', params);
    }

    async incident(id: number) {
        return this.get<Incident>(`/incidents/${id}`);
    }

    async orders(params?: Record<string, string>) {
        return this.get<Paginated<Order>>('/orders', params);
    }

    async order(id: number) {
        return this.get<Order>(`/orders/${id}`);
    }

    async tenants() {
        return this.get<TenantSummary[]>('/tenants');
    }

    async profile() {
        return this.get<UserProfile>('/profile');
    }

    async updateProfile(data: UpdateProfileData) {
        return this.patch<UserProfile>('/profile', data);
    }
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Paginated<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

export interface Device {
    id: number;
    name: string;
    imei: string;
    status: string;
    last_lat: number | null;
    last_lon: number | null;
    battery_percent: number | null;
    last_signal_at: string | null;
    device_type?: { id: number; name: string; slug: string; image?: string };
    tenant?: { id: number; name: string; slug: string };
}

export interface Incident {
    id: number;
    event_type: string;
    status: string;
    priority: string;
    level: number;
    triggered_at: string;
    resolved_at: string | null;
    device?: { id: number; name: string; imei: string };
    beat?: { id: number; name: string };
}

export interface Order {
    id: number;
    order_number: string;
    status: string;
    total_usd: number | null;
    total_pkr: number | null;
    items: OrderItem[];
    created_at: string;
    shipped_at: string | null;
    delivered_at: string | null;
    tracking_number: string | null;
}

export interface OrderItem {
    id: number;
    product_name: string;
    product_type: 'device' | 'accessory';
    quantity: number;
    unit_price_usd: number | null;
}

export interface TenantSummary {
    id: number;
    name: string;
    slug: string;
    app_name: string | null;
    logo_url: string | null;
    status: string;
    portal_url: string;
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    timezone: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
}

export interface UpdateProfileData {
    name?: string;
    phone?: string;
    timezone?: string;
}
