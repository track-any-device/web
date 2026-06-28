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
        return res.json();
    }

    private async delete(path: string): Promise<void> {
        const url = `${API_URL}/api/my${path}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.token}`, 'Accept': 'application/json' },
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.throwApiError('DELETE', url, res.status, text);
        }
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    async dashboard() {
        return this.get<{
            device_count: number;
            order_count:  number;
            tenant_count: number;
            open_incidents: Incident[];
        }>('/dashboard');
    }

    // ── Devices ──────────────────────────────────────────────────────────────

    async devices(params?: Record<string, string>) {
        return this.get<Paginated<Device>>('/devices', params);
    }

    async device(id: number) {
        return this.get<Device>(`/devices/${id}`);
    }

    /**
     * Device trail (telemetry points).
     *  - Recent mode  → pass a number of hours (default 12) or `{ hours }`.
     *  - Range mode   → pass `{ from, to }` (both ISO strings) to fetch an exact window.
     * Back-compat: existing callers passing a bare `hours` number keep working.
     */
    async deviceTrail(id: number, opts: number | TrailQuery = 12) {
        const q: TrailQuery = typeof opts === 'number' ? { hours: opts } : opts;
        const params: Record<string, string> =
            q.from != null && q.to != null
                ? { from: q.from, to: q.to }
                : { hours: String(q.hours ?? 12) };
        return this.get<TrailResponse>(`/devices/${id}/trail`, params);
    }

    /** Paginated trips. Defaults to page 1, 20 per page. */
    async deviceTrips(id: number, opts: { page?: number; per_page?: number } = {}) {
        const params: Record<string, string> = {
            page:     String(opts.page ?? 1),
            per_page: String(opts.per_page ?? 20),
        };
        return this.get<TripsResponse>(`/devices/${id}/trips`, params);
    }

    async updateDevice(id: number, data: UpdateDeviceData) {
        return this.patch<Device>(`/devices/${id}`, data);
    }

    // ── Capabilities / commands / tracking mode ──────────────────────────────
    // Capabilities, commands and tracking modes are entirely driven by the device
    // type — never hardcode the lists in the UI.

    async deviceCapabilities(id: number) {
        return this.get<DeviceCapabilities>(`/devices/${id}/capabilities`);
    }

    async sendDeviceCommand(id: number, command: string) {
        return this.post<{ message: string; commandId: number | string; status: string }>(
            `/devices/${id}/command`, { command },
        );
    }

    async setTrackingMode(id: number, mode: string) {
        return this.post<{ message?: string; mode?: string }>(`/devices/${id}/tracking-mode`, { mode });
    }

    async unlinkDevice(id: number): Promise<void> {
        await this.delete(`/devices/${id}`);
    }

    async uploadDeviceImage(id: number, file: File): Promise<{ image_url: string }> {
        const url = `${API_URL}/api/my/devices/${id}/image`;
        const form = new FormData();
        form.append('image', file);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}`, 'Accept': 'application/json' },
            body: form,
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.throwApiError('POST', url, res.status, text);
        }
        return res.json();
    }

    async registerDevice(deviceId: string, name?: string): Promise<RegisterDeviceResult> {
        return this.post<RegisterDeviceResult>('/devices/register', {
            device_id: deviceId,
            ...(name && name.trim() ? { name: name.trim() } : {}),
        });
    }

    async assignBeat(deviceId: number, beatId: number) {
        return this.put<{ beat: { id: number; name: string; color: string } }>(`/devices/${deviceId}/beat`, { beat_id: beatId });
    }

    async unassignBeat(deviceId: number) {
        await this.delete(`/devices/${deviceId}/beat`);
    }

    /** Move an owned device into one of the user's organisations. The user loses personal
     *  tracking of it afterwards — it becomes visible only inside that tenant. */
    async assignDeviceTenant(deviceId: number, tenantId: number) {
        return this.post<AssignTenantResult>(`/devices/${deviceId}/assign-tenant`, { tenant_id: tenantId });
    }

    // ── Notification Preferences ─────────────────────────────────────────────

    async getNotificationPreferences(deviceId: number) {
        return this.get<{ data: NotificationPreference[] }>(`/devices/${deviceId}/notification-preferences`);
    }

    async updateNotificationPreferences(deviceId: number, preferences: Array<{ event_type: string; sms_enabled: boolean; thresholds?: Record<string, number> }>) {
        return this.put<{ message: string }>(`/devices/${deviceId}/notification-preferences`, { preferences });
    }

    // ── Incidents ────────────────────────────────────────────────────────────

    async incidents(params?: IncidentParams) {
        return this.get<Paginated<Incident>>('/incidents', params as Record<string, string>);
    }

    async incident(id: number) {
        return this.get<Incident>(`/incidents/${id}`);
    }

    /** Full incident detail: the incident attributes plus the captured trail, the
     *  lifecycle timeline, and past occurrences of the same alert on the same device. */
    async getIncident(id: number) {
        return this.get<IncidentDetail>(`/incidents/${id}`);
    }

    // ── Orders ───────────────────────────────────────────────────────────────

    async orders(params?: Record<string, string>) {
        return this.get<Paginated<Order>>('/orders', params);
    }

    async order(id: number) {
        return this.get<Order>(`/orders/${id}`);
    }

    // ── Tenants ──────────────────────────────────────────────────────────────

    async tenants() {
        return this.get<TenantSummary[]>('/tenants');
    }

    async requestTenant(data: { org_name: string; message?: string }): Promise<{ message: string }> {
        return this.post('/tenant-request', data);
    }

    // ── Profile ──────────────────────────────────────────────────────────────

    async profile() {
        return this.get<UserProfile>('/profile');
    }

    async updateProfile(data: UpdateProfileData) {
        return this.patch<UserProfile>('/profile', data);
    }

    // ── Beats ────────────────────────────────────────────────────────────────

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
    image_url: string | null;
    notes: string | null;
    last_lat: number | null;
    last_lon: number | null;
    battery_percent: number | null;
    last_seen_at: string | null;
    current_beat: { id: number; name: string; color: string } | null;
    device_type?: { id: number; name: string; slug: string; image?: string };
    tenant?: { id: number; name: string; slug: string };
}

export interface UpdateDeviceData {
    name?: string;
    map_icon?: string | null;
    notes?: string | null;
}

export interface RegisterDeviceResult {
    message: string;
    device_id?: number;
    name?: string;
    imei?: string;
}

export interface DeviceCommand {
    key: string;
    label: string;
    danger?: boolean;
}

export interface DeviceTrackingMode {
    key: string;
    label: string;
    interval: number;
}

export interface DeviceCapabilities {
    deviceId: string;
    commands: DeviceCommand[];
    trackingModes: DeviceTrackingMode[];
    notificationEvents: string[];
    trackingMode: string;
}

export interface NotificationPreference {
    event_type: string;
    label: string;
    sms_enabled: boolean;
    sms_disabled_until: string | null;
    threshold_fields: string[];
    thresholds: Record<string, number> | null;
}

export interface IncidentParams {
    status?: string;
    device_id?: string;
    beat_id?: string;
    days?: string;
    per_page?: string;
    page?: string;
}

export interface Incident {
    id: number;
    event_type: string;
    /** Human label from the API — distinguishes an exclusion-zone breach from a normal beat exit
     *  (both share event_type 'beat_violation'). Falls back to client humanization when absent. */
    display_label?: string;
    status: string;
    priority: string;
    level: number;
    triggered_at: string;
    resolved_at: string | null;
    device?: { id: number; name: string; imei: string };
    beat?: { id: number; name: string };
    /** Live metric for an OPEN incident (null once closed): overspeed → speed (km/h),
     *  low_battery → battery (%), beat_violation → distanceM (metres from the assigned beat). */
    current?: { speed: number | null; battery: number | null; distanceM: number | null } | null;
    /** Where the incident fired (null when no GPS fix was captured). Used to place an
     *  incident marker on the trip-playback map and the standalone-incident replay. */
    lat?: number | null;
    lng?: number | null;
}

export interface IncidentLocation {
    latitude: number | null;
    longitude: number | null;
    speed: number | null;
    recorded_at: string | null;
}

export interface IncidentTimelineStage {
    key: 'triggered' | 'acknowledged' | 'resolved';
    label: string;
    at: string;
}

export interface IncidentHistoryEntry {
    id: number;
    status: string;
    priority: string;
    triggeredAt: string | null;
    resolvedAt: string | null;
    lat: number | null;
    lon: number | null;
}

/** The raw Eloquent incident merged with the three detail extras. Snake/camel mixed
 *  intentionally — it mirrors the API payload exactly. */
export interface IncidentDetail extends Incident {
    latitude: number | null;
    longitude: number | null;
    acknowledged_at: string | null;
    resolution_notes: string | null;
    assignee?: { id: number; name: string } | null;
    locations: IncidentLocation[];
    timeline: IncidentTimelineStage[];
    history: IncidentHistoryEntry[];
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

/** Query for ApiClient.deviceTrail — range mode when both from+to are set, else recent (hours). */
export interface TrailQuery {
    hours?: number;
    from?: string;
    to?: string;
}

export interface TrailPoint {
    lat: number;
    lng: number;
    t: string | null;
    speed: number | null;
    battery: number | null;
}

export interface TrailResponse {
    deviceId: string;
    /** present in recent mode */
    hours?: number;
    /** present in range mode */
    from?: string;
    to?: string;
    count: number;
    points: TrailPoint[];
}

export interface Trip {
    id: number;
    startedAt: string | null;
    endedAt: string | null;
    durationS: number | null;
    distanceM: number;
    distanceKm: number;
    maxSpeed: number | null;
    points: number;
    start: { lat: number; lng: number };
    end: { lat: number; lng: number } | null;
}

export interface TripsResponse {
    deviceId: string;
    trips: Trip[];
    page: number;
    per_page: number;
    last_page: number;
    total: number;
    count: number;
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

export interface AssignTenantResult {
    message: string;
    deviceId: number;
    tenant: { id: number; name: string };
}
