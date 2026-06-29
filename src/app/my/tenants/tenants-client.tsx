'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, ChevronRight, Smartphone, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { TenantSummary, Device } from '@/lib/api-client';
import Image from 'next/image';
import { TenantDeviceRow } from './tenant-device-list';

interface TenantDevicesState {
    loading: boolean;
    error: string | null;
    devices: Device[] | null;
}

/** Tenants with this many devices or fewer expand inline; larger ones get a dedicated page. */
const INLINE_DEVICE_LIMIT = 3;

export default function TenantsClient() {
    const { token } = useAuth();
    const router = useRouter();
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Per-tenant expand state + lazily-loaded device lists.
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [devicesByTenant, setDevicesByTenant] = useState<Record<number, TenantDevicesState>>({});
    // Per-device claim state + a small banner of recently claimed device names.
    const [claiming, setClaiming] = useState<Record<number, boolean>>({});
    const [claimed, setClaimed] = useState<string | null>(null);

    // Request-a-tenant-account flow (relocated from the profile page).
    const [showRequest, setShowRequest] = useState(false);
    const [orgName, setOrgName]         = useState('');
    const [reqMessage, setReqMessage]   = useState('');
    const [submitting, setSubmitting]   = useState(false);
    const [reqSuccess, setReqSuccess]   = useState(false);
    const [reqError, setReqError]       = useState<string | null>(null);

    const submitRequest = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim() || !token) return;
        setSubmitting(true);
        setReqError(null);
        try {
            await new ApiClient(token).requestTenant({
                org_name: orgName.trim(),
                message:  reqMessage.trim() || undefined,
            });
            setReqSuccess(true);
            setShowRequest(false);
        } catch (err) {
            setReqError((err as { message?: string })?.message ?? 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    }, [orgName, reqMessage, token]);

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
                // Keep the card's device_count badge honest.
                setTenants((prev) => prev.map((t) => t.id === tenantId ? { ...t, device_count: Math.max(0, t.device_count - 1) } : t));
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
                    Open an organisation to see its devices. You can move any of them into your personal account.
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
                        const isInline = tenant.device_count <= INLINE_DEVICE_LIMIT;
                        const isOpen = isInline && !!expanded[tenant.id];
                        const state = devicesByTenant[tenant.id];
                        // Small tenants expand inline; large tenants navigate to a dedicated page.
                        const onActivate = isInline
                            ? () => toggle(tenant.id)
                            : () => router.push(`/my/tenants/${tenant.id}`);
                        return (
                            <div key={tenant.id} className="tad-card overflow-hidden">
                                {/* Header — click to expand (small) or open the tenant page (large). */}
                                <div className="tad-card__body">
                                    <button
                                        type="button"
                                        onClick={onActivate}
                                        aria-expanded={isInline ? isOpen : undefined}
                                        className="flex items-center gap-4 w-full min-w-0 text-left">
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
                                            <p className="truncate inline-flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                <Smartphone className="w-3 h-3 shrink-0" />
                                                {tenant.device_count} {tenant.device_count === 1 ? 'device' : 'devices'}
                                            </p>
                                        </div>
                                        {isInline
                                            ? (isOpen
                                                ? <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                                : <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />)
                                            : <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                </div>

                                {/* Inline devices (small tenants only) */}
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
                                                    <TenantDeviceRow
                                                        key={d.id}
                                                        device={d}
                                                        claiming={!!claiming[d.id]}
                                                        onClaim={(device) => claim(tenant.id, device)}
                                                    />
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

            {/* Request a tenant account — relocated from /my/profile. The tenants page is the home
                for organisation features, so the CTA to create a new one lives here. */}
            <div className="rounded-2xl px-5 py-4"
                style={{ border: '1px solid var(--border)', background: 'var(--brand-subtle)' }}>
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--surface)', color: 'var(--brand)' }}>
                        <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--brand-on-subtle)' }}>
                            Need an organisation account?
                        </p>
                        <p className="mt-0.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-on-subtle)' }}>
                            A dedicated tenant account gives you team access, custom branding, and advanced controls for your fleet.
                        </p>
                    </div>
                </div>

                {reqSuccess ? (
                    <div className="mt-4 rounded-xl px-4 py-3"
                        style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)' }}>
                        Request submitted — our team will contact you shortly.
                    </div>
                ) : !showRequest ? (
                    <button onClick={() => setShowRequest(true)} className="tad-btn tad-btn--primary tad-btn--sm mt-4">
                        Request tenant account
                    </button>
                ) : (
                    <form onSubmit={submitRequest} className="mt-4 space-y-3">
                        {reqError && (
                            <div className="rounded-lg px-3 py-2"
                                style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                {reqError}
                            </div>
                        )}
                        <div className="tad-field">
                            <label className="tad-field__label">
                                Organisation / company name<span className="tad-field__req">*</span>
                            </label>
                            <input
                                type="text"
                                value={orgName}
                                onChange={e => setOrgName(e.target.value)}
                                required
                                placeholder="e.g. City police department"
                                className="tad-input"
                            />
                        </div>
                        <div className="tad-field">
                            <label className="tad-field__label">
                                Additional notes (optional)
                            </label>
                            <textarea
                                value={reqMessage}
                                onChange={e => setReqMessage(e.target.value)}
                                rows={3}
                                placeholder="Tell us about your use case, team size, or special requirements…"
                                className="tad-input resize-none"
                                style={{ height: 'auto', padding: '8px 12px' }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setShowRequest(false)}
                                className="tad-btn tad-btn--secondary tad-btn--sm">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting || !orgName.trim()}
                                className="tad-btn tad-btn--primary tad-btn--sm">
                                {submitting ? 'Submitting…' : 'Submit request'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
