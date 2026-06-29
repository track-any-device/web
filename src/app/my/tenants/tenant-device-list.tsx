'use client';

import { Smartphone, MapPin, BatteryMedium, ArrowDownToLine, Loader2 } from 'lucide-react';
import type { Device } from '@/lib/api-client';
import Image from 'next/image';

export function timeAgo(iso: string | null): string {
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

/** A single tenant-device row with the "Move to my account" claim action.
 *  Shared by the inline accordion (tenants-client) and the dedicated tenant page. */
export function TenantDeviceRow({
    device,
    claiming,
    onClaim,
}: {
    device: Device;
    claiming: boolean;
    onClaim: (device: Device) => void;
}) {
    return (
        <li className="px-5 py-3 flex items-center gap-3"
            style={{ borderTop: '1px solid var(--border-subtle, var(--border))' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface-sunken)' }}>
                {device.image_url
                    ? <Image src={device.image_url} alt="" width={36} height={36} className="rounded-lg object-cover" />
                    : <Smartphone className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate" style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{device.name}</p>
                <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <span className="font-mono">{device.imei}</span>
                    {(device.last_lat != null && device.last_lon != null) && (
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {timeAgo(device.last_seen_at)}</span>
                    )}
                    {device.battery_percent != null && (
                        <span className="inline-flex items-center gap-1"><BatteryMedium className="w-3 h-3" /> {device.battery_percent}%</span>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={() => onClaim(device)}
                disabled={claiming}
                className="tad-btn tad-btn--secondary tad-btn--sm shrink-0 inline-flex items-center gap-1.5">
                {claiming
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Moving…</>
                    : <><ArrowDownToLine className="w-3.5 h-3.5" /> Move to my account</>}
            </button>
        </li>
    );
}
