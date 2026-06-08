/**
 * REST API client for the central app/ My Portal API.
 *
 * All calls require a Passport bearer token (the user's SSO access token).
 * Token is read from the tad_session cookie via getSession() in server components.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

export class ApiClient {
    constructor(private token: string) {}

    private throwApiError(method: string, url: string, status: number, body: string): never {
        if (status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tad:unauthorized'));
        }
        const msg = `[API] ${method} ${url} → ${status}: ${body.slice(0, 400)}`;
        console.error(msg);
        throw new Error(msg);
    }

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
            this.throwApiError('GET', url.toString(), res.status, body);
        }
        return res.json() as Promise<T>;
    }

    private async patch<T>(path: string, body: unknown): Promise<T> {
        const url = `${API_URL}/api/my${path}`;
        const res = await fetch(url, {
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
            this.throwApiError('PATCH', url, res.status, text);
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

    async updateDevice(id: number, data: { name?: string; map_icon?: string | null }) {
        return this.patch<Device>(`/devices/${id}`, data);
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

    async beats() {
        return this.get<{ data: Beat[] }>('/beats');
    }

    async beat(id: number) {
        return this.get<BeatDetail>(`/beats/${id}`);
    }

    async createBeat(data: BeatPayload) {
        return this.post<BeatDetail>('/beats', data);
    }

    async updateBeat(id: number, data: BeatPayload) {
        return this.put<BeatDetail>(`/beats/${id}`, data);
    }

    async deleteBeat(id: number) {
        const url = `${API_URL}/api/my/beats/${id}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}`, 'Accept': 'application/json' },
        });
        if (!res.ok && res.status !== 204) {
            const body = await res.text().catch(() => '');
            this.throwApiError('DELETE', url, res.status, body);
        }
    }

    private async post<T>(path: string, body: unknown): Promise<T> {
        const url = `${API_URL}/api/my${path}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.throwApiError('POST', url, res.status, text);
        }
        return res.json();
    }

    private async put<T>(path: string, body: unknown): Promise<T> {
        const url = `${API_URL}/api/my${path}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.throwApiError('PUT', url, res.status, text);
        }
        return res.json();
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
    map_icon: string | null;
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

export interface LatLng {
    lat: number;
    lng: number;
}

export interface Beat {
    id: number;
    name: string;
    description: string | null;
    geo_fence_type: 'polygon' | 'circle';
    color: string;
    status: string;
    coordinates: LatLng[];
    created_at: string;
    updated_at: string;
}

export type BeatDetail = Beat;

export interface BeatPayload {
    name: string;
    description?: string;
    geo_fence_type: 'polygon' | 'circle';
    color: string;
    coordinates: LatLng[];
}

export interface UpdateProfileData {
    name?: string;
    phone?: string;
    timezone?: string;
}
