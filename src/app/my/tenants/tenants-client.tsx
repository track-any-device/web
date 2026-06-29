'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, ExternalLink, ChevronDown, ChevronRight, Smartphone, MapPin, BatteryMedium, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { TenantSummary, Device } from '@/lib/api-client';
import Image from 'next/image';

interface TenantDevicesState {
    loading: boolean;
    error: string | null;
    devices: Device[] | null;
}

function timeAgo(iso: string | null): string {
    if (!iso) return 'never';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'never';
    const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
}

export default function TenantsClient() {
    const { token } = useAuth();
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Per-tenant expand state + lazily-loaded device lists.
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [devicesByTenant, setDevicesByTenant] = useState<Record<number, TenantDevicesState>>({});
    // Per-device claim state + a small banner of recently claimed device names.
    const [claiming, setClaiming] = useState<Record<number, boolean>>({});
    const [claimed, setClaimed] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.tenants()
            .then(setTenants)
            .catch((e) => setApiError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, [token]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    const loadDevices = useCallback((tenantId: number) => {
        if (!token) return;
        setDevicesByTenant((prev) => ({ ...prev, [tenantId]: { loading: true, error: null, devices: prev[tenantId]?.devices ?? null } }));
        new ApiClient(token).tenantDevices(tenantId)
            .then((res) => setDevicesByTenant((prev) => ({ ...prev, [tenantId]: { loading: false, error: null, devices: res.devices } })))
            .catch((e) => setDevicesByTenant((prev) => ({ ...prev, [tenantId]: { loading: false, error: e instanceof Error ? e.message : String(e), devices: null } })));
    }, [token]);

    const toggle = useCallback((tenantId: number) => {
        setExpanded((prev) => {
            const next = !prev[tenantId];
            if (next && !devicesByTenant[tenantId]?.devices) loadDevices(tenantId);
            return { ...prev, [tenantId]: next };
        });
    }, [devicesByTenant, loadDevices]);

    const claim = useCallback((tenantId: number, device: Device) => {
        if (!token) return;
        setClaiming((prev) => ({ ...prev, [device.id]: true }));
        new ApiClient(token).deviceClaim(device.id)
            .then((res) => {
                setClaimed(res.device?.name ?? device.name);
                // Drop the device from the tenant's list — it's now personal.
                setDevicesByTenant((prev) => {
                    const cur = prev[tenantId];
                    if (!cur?.devices) return prev;
                    return { ...prev, [tenantId]: { ...cur, devices: cur.devices.filter((d) => d.id !== device.id) } };
                });
            })
            .catch((e) => setApiError(e instanceof Error ? e.message : String(e)))
            .finally(() => setClaiming((prev) => ({ ...prev, [device.id]: false })));
    }, [token]);

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 space-y-6 sm:p-6 lg:p-8">
            <div className="space-y-1">
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                    My organisations ({tenants.length})
                </h1>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    Expand an organisation to see its devices. You can move any of them into your personal account.
                </p>
            </div>

            {claimed && (
                <div className="rounded-lg px-4 py-3 flex items-center gap-2"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)' }}>
                    <ArrowDownToLine className="w-4 h-4 shrink-0" />
                    <span><strong>{claimed}</strong> is now in your personal account.</span>
                </div>
            )}

            {apiError && (
                <div className="rounded-lg px-4 py-3 break-all"
                    style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                    {apiError}
                </div>
            )}

            {!apiError && tenants.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                    <Building2 className="w-10 h-10" style={{ color: 'var(--text-subtle)' }} />
                    <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>No organisations yet</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>You&apos;ll appear here when an admin adds you to an organisation.</p>
                </div>
            )}

            {!apiError && tenants.length > 0 && (
                <div className="space-y-4">
                    {tenants.map((tenant) => {
                        const isOpen = !!expanded[tenant.id];
                        const state = devicesByTenant[tenant.id];
                        return (
                            <div key={tenant.id} className="tad-card overflow-hidden">
                                {/* Header — click to expand devices; portal link is a separate action */}
                                <div className="tad-card__body flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => toggle(tenant.id)}
                                        aria-expanded={isOpen}
                                        className="flex items-center gap-4 flex-1 min-w-0 text-left">
                                        {tenant.logo_url ? (
                                            <Image src={tenant.logo_url} alt={tenant.name} width={48} height={48}
                                                className="rounded-lg object-contain shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ background: 'linear-gradient(135deg, var(--pak-700), var(--pak-400))' }}>
                                                <span style={{ color: '#fff', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-display)' }}>
                                                    {(tenant.app_name ?? tenant.name).charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate" style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>
                                                {tenant.app_name ?? tenant.name}
                                            </p>
                                            <p className="truncate" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                                                {tenant.slug}.track-any-device.com
                                            </p>
                                        </div>
                                        {isOpen
                                            ? <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                            : <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                    <a href={tenant.portal_url} target="_blank" rel="noopener noreferrer"
                                        className="tad-btn tad-btn--secondary tad-btn--sm shrink-0 inline-flex items-center gap-1.5"
                                        title="Open organisation portal">
                                        Portal <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>

                                {/* Devices */}
                                {isOpen && (
                                    <div style={{ borderTop: '1px solid var(--border)' }}>
                                        {state?.loading && (
                                            <div className="px-5 py-6 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Loading devices…
                                            </div>
                                        )}
                                        {state?.error && (
                                            <div className="px-5 py-4 break-all"
                                                style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                                                {state.error}
                                            </div>
                                        )}
                                        {!state?.loading && !state?.error && state?.devices?.length === 0 && (
                                            <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                                                <Smartphone className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>This organisation has no devices yet.</p>
                                            </div>
                                        )}
                                        {!state?.loading && !state?.error && state?.devices && state.devices.length > 0 && (
                                            <ul>
                                                {state.devices.map((d) => (
                                                    <li key={d.id} className="px-5 py-3 flex items-center gap-3"
                                                        style={{ borderTop: '1px solid var(--border-subtle, var(--border))' }}>
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                                            style={{ background: 'var(--surface-sunken)' }}>
                                                            {d.image_url
                                                                ? <Image src={d.image_url} alt="" width={36} height={36} className="rounded-lg object-cover" />
                                                                : <Smartphone className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate" style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{d.name}</p>
                                                            <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                                <span className="font-mono">{d.imei}</span>
                                                                {(d.last_lat != null && d.last_lon != null) && (
                                                                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {timeAgo(d.last_seen_at)}</span>
                                                                )}
                                                                {d.battery_percent != null && (
                                                                    <span className="inline-flex items-center gap-1"><BatteryMedium className="w-3 h-3" /> {d.battery_percent}%</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => claim(tenant.id, d)}
                                                            disabled={!!claiming[d.id]}
                                                            className="tad-btn tad-btn--secondary tad-btn--sm shrink-0 inline-flex items-center gap-1.5">
                                                            {claiming[d.id]
                                                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Moving…</>
                                                                : <><ArrowDownToLine className="w-3.5 h-3.5" /> Move to my account</>}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
