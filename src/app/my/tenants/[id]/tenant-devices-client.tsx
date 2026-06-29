'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Smartphone, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { Device, TenantDevicesResult } from '@/lib/api-client';
import { TenantDeviceRow } from '../tenant-device-list';

/** Dedicated page for a single organisation's devices — used for tenants with more devices
 *  than the inline accordion shows. Lists ALL the tenant's devices with the same
 *  "Move to my account" claim action as the accordion. */
export default function TenantDevicesClient({ tenantId }: { tenantId: number }) {
    const { token } = useAuth();
    const [data, setData] = useState<TenantDevicesResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [claiming, setClaiming] = useState<Record<number, boolean>>({});
    const [claimed, setClaimed] = useState<string | null>(null);

    useEffect(() => {
        if (!token || Number.isNaN(tenantId)) return;
        new ApiClient(token).tenantDevices(tenantId)
            .then(setData)
            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, [token, tenantId]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    const claim = useCallback((device: Device) => {
        if (!token) return;
        setClaiming((prev) => ({ ...prev, [device.id]: true }));
        new ApiClient(token).deviceClaim(device.id)
            .then((res) => {
                setClaimed(res.device?.name ?? device.name);
                // Drop the device from the list — it's now personal.
                setData((prev) => prev
                    ? { ...prev, devices: prev.devices.filter((d) => d.id !== device.id), count: Math.max(0, prev.count - 1) }
                    : prev);
            })
            .catch((e) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setClaiming((prev) => ({ ...prev, [device.id]: false })));
    }, [token]);

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    const devices = data?.devices ?? [];

    return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 space-y-6 sm:p-6 lg:p-8">
            <Link href="/my/tenants" className="inline-flex items-center gap-1.5"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                <ArrowLeft className="w-4 h-4" /> All organisations
            </Link>

            <div className="space-y-1">
                <h1 className="inline-flex items-center gap-2" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                    <Building2 className="w-6 h-6 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    {data?.tenant?.name ?? 'Organisation'}
                </h1>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {data ? `${devices.length} ${devices.length === 1 ? 'device' : 'devices'}` : ''} — move any of them into your personal account.
                </p>
            </div>

            {claimed && (
                <div className="rounded-lg px-4 py-3 flex items-center gap-2"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)' }}>
                    <ArrowDownToLine className="w-4 h-4 shrink-0" />
                    <span><strong>{claimed}</strong> is now in your personal account.</span>
                </div>
            )}

            {error && (
                <div className="rounded-lg px-4 py-3 break-all"
                    style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                    {error}
                </div>
            )}

            {!error && devices.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                    <Smartphone className="w-10 h-10" style={{ color: 'var(--text-subtle)' }} />
                    <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>No devices yet</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>This organisation has no devices yet.</p>
                </div>
            )}

            {!error && devices.length > 0 && (
                <div className="tad-card overflow-hidden">
                    <ul>
                        {devices.map((d) => (
                            <TenantDeviceRow
                                key={d.id}
                                device={d}
                                claiming={!!claiming[d.id]}
                                onClaim={claim}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
