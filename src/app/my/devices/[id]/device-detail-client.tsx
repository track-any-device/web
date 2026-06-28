'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Smartphone, MapPin, Camera, AlertTriangle, Bell, BellOff,
    Navigation, Route, ChevronLeft, Send, CheckCircle2, Battery, BatteryLow,
    LayoutGrid, SlidersHorizontal, Settings2, Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type {
    Device, Incident, Beat, NotificationPreference,
    DeviceCapabilities, DeviceCommand, DeviceTrackingMode,
} from '@/lib/api-client';
import { Card, Button, Switch, Input, Tabs } from '@/components/ui';
import { DeviceSummaryCard } from './device-summary-card';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// ── Live status (mirrors the list view) ───────────────────────────────────────
type MyStatus = 'online' | 'offline' | 'unavailable';

function getMyStatus(device: Device): MyStatus {
    if (!device.last_seen_at) return 'unavailable';
    const mins = (Date.now() - new Date(device.last_seen_at).getTime()) / 60_000;
    if (mins <= 30)   return 'online';
    if (mins <= 1440) return 'offline';
    return 'unavailable';
}

// The header chip uses the customer-facing Moving / Idle / Offline wording.
const STATUS_CHIP: Record<MyStatus, { label: string; dot: string; color: string; bg: string }> = {
    online:      { label: 'Moving',  dot: 'var(--success)',   color: 'var(--success)',   bg: 'var(--success-bg)' },
    offline:     { label: 'Idle',    dot: 'var(--warning)',   color: 'var(--warning)',   bg: 'var(--warning-bg)' },
    unavailable: { label: 'Offline', dot: 'var(--text-muted)', color: 'var(--text-muted)', bg: 'var(--surface-sunken)' },
};
const STATUS_PIN: Record<MyStatus, string> = {
    online: '#1F9462', offline: '#F0463C', unavailable: '#8A7E6C',
};

// ── Timeline event (merged trips + incidents) ─────────────────────────────────
type TimelineEvent = {
    id:    string;
    kind:  'departed' | 'arrived' | 'incident';
    label: string;
    at:    number;        // epoch ms for sorting
    when:  string;        // formatted display
    href?: string;        // incidents link to their detail page
};

// A trail point with the fields needed for the activity + battery graphs.
type TrailPoint = { lat: number; lng: number; t: string | null; speed: number | null; battery: number | null };

function fmtWhen(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

type TabKey = 'overview' | 'timeline' | 'settings' | 'manage';

export default function DeviceDetailClient({ deviceId }: { deviceId: number }) {
    const { token } = useAuth();
    const router    = useRouter();

    const [device,       setDevice]       = useState<Device | null>(null);
    const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
    const [trail,        setTrail]        = useState<TrailPoint[]>([]);
    const [timeline,     setTimeline]     = useState<TimelineEvent[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [loadError,    setLoadError]    = useState<string | null>(null);
    const [tab,          setTab]          = useState<TabKey>('overview');

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        setLoading(true);
        const api = new ApiClient(token);
        Promise.allSettled([
            api.device(deviceId),
            api.deviceCapabilities(deviceId),
            api.deviceTrail(deviceId, 24),
            api.deviceTrips(deviceId),
            api.incidents({ device_id: String(deviceId), per_page: '50' }),
        ]).then(([dev, caps, tr, trips, inc]) => {
            if (cancelled) return;
            if (dev.status === 'fulfilled') {
                setDevice(dev.value);
            } else {
                setLoadError('We could not load this device.');
            }
            if (caps.status === 'fulfilled') setCapabilities(caps.value);

            if (tr.status === 'fulfilled') {
                setTrail(tr.value.points
                    .filter(p => p.lat != null && p.lng != null)
                    .map(p => ({ lat: p.lat, lng: p.lng, t: p.t, speed: p.speed, battery: p.battery ?? null })));
            }

            // Merge trips (Departed/Arrived) + incidents into one chronological timeline.
            const events: TimelineEvent[] = [];
            if (trips.status === 'fulfilled') {
                trips.value.trips.forEach(t => {
                    if (t.startedAt) {
                        events.push({ id: `trip-${t.id}-start`, kind: 'departed', label: 'Departed', at: new Date(t.startedAt).getTime(), when: fmtWhen(t.startedAt) });
                    }
                    if (t.endedAt) {
                        events.push({ id: `trip-${t.id}-end`, kind: 'arrived', label: 'Arrived', at: new Date(t.endedAt).getTime(), when: fmtWhen(t.endedAt) });
                    }
                });
            }
            if (inc.status === 'fulfilled') {
                inc.value.data.forEach(i => {
                    events.push({
                        id:    `inc-${i.id}`,
                        kind:  'incident',
                        label: i.display_label ?? i.event_type.replace(/_/g, ' '),
                        at:    new Date(i.triggered_at).getTime(),
                        when:  fmtWhen(i.triggered_at),
                        href:  `/my/incidents/${i.id}`,
                    });
                });
            }
            events.sort((a, b) => b.at - a.at); // newest first
            setTimeline(events);
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, deviceId]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    if (loading) {
        return null; // the portal LoadingProvider overlay covers this area
    }

    if (!device) {
        return (
            <div className="mx-auto w-full max-w-[1240px] px-4 py-6 space-y-4 sm:px-6 lg:px-7">
                <Link href="/my/devices" className="inline-flex items-center gap-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    <ChevronLeft className="w-4 h-4" /> My things
                </Link>
                <Card>
                    <div className="flex flex-col items-center text-center py-8" style={{ gap: 10 }}>
                        <AlertTriangle className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{loadError ?? 'Device not found.'}</p>
                    </div>
                </Card>
            </div>
        );
    }

    const status   = getMyStatus(device);
    const chip     = STATUS_CHIP[status];
    const location = device.last_lat != null && device.last_lon != null
        ? `${Number(device.last_lat).toFixed(4)}, ${Number(device.last_lon).toFixed(4)}`
        : 'No location yet';

    // Current speed comes from the most-recent trail point (the Device shape has no speed field).
    const latestSpeed = (() => {
        for (let i = trail.length - 1; i >= 0; i--) {
            if (trail[i].t != null) return trail[i].speed;
        }
        return trail.length ? trail[trail.length - 1].speed : null;
    })();

    const tabItems = [
        { value: 'overview', label: 'Overview', icon: <LayoutGrid /> },
        { value: 'timeline', label: 'Timeline', icon: <Route />, count: timeline.length || undefined },
        { value: 'settings', label: 'Settings', icon: <SlidersHorizontal /> },
        { value: 'manage',   label: 'Manage',   icon: <Settings2 /> },
    ];

    return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 space-y-4 sm:px-6 lg:px-7">

            {/* Back link */}
            <Link href="/my/devices" className="inline-flex items-center gap-1"
                style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-muted)', textDecoration: 'none' }}>
                <ChevronLeft className="w-4 h-4" /> My things
            </Link>

            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden sm:w-14 sm:h-14"
                    style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
                    {device.image_url
                        ? <img src={device.image_url} alt="" className="w-full h-full object-cover" />
                        : (device.map_icon ? <span style={{ fontSize: 26 }}>{device.map_icon}</span> : <Smartphone className="w-6 h-6" />)}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
                        {device.name}
                    </h1>
                    <p className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        {device.imei} · {location}
                    </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5"
                    style={{ borderRadius: 'var(--radius-pill)', background: chip.bg, color: chip.color, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: chip.dot }} />
                    {chip.label}
                </span>
            </div>

            {/* Tabs — pill variant; scrolls horizontally on narrow phones rather than wrapping. */}
            <div className="-mx-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <Tabs
                    variant="pill"
                    items={tabItems}
                    value={tab}
                    onChange={(v) => setTab(v as TabKey)}
                    style={{ display: 'flex' }}
                />
            </div>

            {/* ── Overview ───────────────────────────────────────────────────── */}
            {tab === 'overview' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                        <DeviceSummaryCard
                            name={device.name}
                            speed={latestSpeed}
                            lastSeenAt={device.last_seen_at}
                            online={status === 'online'}
                            battery={device.battery_percent}
                            statusLabel={chip.label}
                            statusColor={chip.color}
                            productTag={device.device_type?.name ?? null}
                        />
                        <LiveLocationCard device={device} trail={trail} status={status} />
                    </div>
                    <ActivityCard token={token!} deviceId={deviceId} initialTrail={trail} />
                </div>
            )}

            {/* ── Timeline ───────────────────────────────────────────────────── */}
            {tab === 'timeline' && (
                <Card title="Trip timeline">
                    {timeline.length === 0 ? (
                        <div className="flex flex-col items-center text-center py-6" style={{ gap: 8 }}>
                            <Route className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No trips or events yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {timeline.map((e, i) => <TimelineRow key={e.id} event={e} last={i === timeline.length - 1} />)}
                        </div>
                    )}
                </Card>
            )}

            {/* ── Settings — tracking mode + notifications ───────────────────── */}
            {tab === 'settings' && (
                <div className="space-y-4">
                    {capabilities && capabilities.trackingModes.length > 0 && (
                        <TrackingModeCard
                            token={token!}
                            deviceId={deviceId}
                            modes={capabilities.trackingModes}
                            current={capabilities.trackingMode}
                        />
                    )}
                    <NotificationsCard token={token!} deviceId={deviceId} />
                </div>
            )}

            {/* ── Manage — remote commands (Locate now, etc.) + device admin ──── */}
            {tab === 'manage' && (
                <div className="space-y-4">
                    <CommandsCard token={token!} deviceId={deviceId} commands={capabilities?.commands ?? null} />
                    <ManageCard
                        token={token!}
                        device={device}
                        onDeviceChange={setDevice}
                        onUnlinked={() => router.push('/my/devices')}
                    />
                </div>
            )}
        </div>
    );
}

// ── 1. Live location map ───────────────────────────────────────────────────────
function LiveLocationCard({ device, trail, status }: { device: Device; trail: Array<{ lat: number; lng: number }>; status: MyStatus }) {
    const mapRef  = useRef<HTMLDivElement>(null);
    const gmapRef = useRef<google.maps.Map | null>(null);
    const [ready, setReady] = useState(false);

    const lat = device.last_lat != null ? Number(device.last_lat) : null;
    const lng = device.last_lon != null ? Number(device.last_lon) : null;
    const hasLocation = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

    // Load the Maps script once
    useEffect(() => {
        if (typeof google !== 'undefined' && google.maps) { setReady(true); return; }
        if (!MAPS_KEY) return;
        const existing = document.querySelector<HTMLScriptElement>('script[data-tad-maps]');
        if (existing) { existing.addEventListener('load', () => setReady(true)); return; }
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=marker`;
        s.async = true;
        s.dataset.tadMaps = '1';
        s.onload = () => setReady(true);
        document.head.appendChild(s);
    }, []);

    // Init / sync a single-device map: one marker + the trail polyline.
    useEffect(() => {
        if (!ready || !mapRef.current || !hasLocation) return;
        const center = { lat: lat!, lng: lng! };

        if (!gmapRef.current) {
            gmapRef.current = new google.maps.Map(mapRef.current, {
                center,
                zoom: 17,
                mapId: 'my-device-detail-map',
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
            });
        } else {
            gmapRef.current.panTo(center);
        }
        const map = gmapRef.current;

        // Marker (small status-coloured dot)
        const dot = document.createElement('div');
        const color = STATUS_PIN[status];
        dot.style.cssText = `width:11px;height:11px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AdvMarker = (google.maps as any).marker?.AdvancedMarkerElement;
        let marker: { setMap: (m: google.maps.Map | null) => void };
        if (AdvMarker) {
            marker = new AdvMarker({ map, position: center, content: dot });
        } else {
            marker = new google.maps.Marker({
                position: center, map, title: device.name,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
            }) as unknown as { setMap: (m: google.maps.Map | null) => void };
        }

        // Trail polyline — keep the view close on the device (no fit-to-bounds, which zooms out).
        let line: google.maps.Polyline | null = null;
        if (trail.length >= 2) {
            line = new google.maps.Polyline({
                path: trail, map, geodesic: true,
                strokeColor: '#01411C', strokeOpacity: 0.85, strokeWeight: 3,
            });
        }

        return () => { marker.setMap(null); line?.setMap(null); };
    }, [ready, hasLocation, lat, lng, status, trail, device.name]);

    return (
        <Card title="Live location" flushBody>
            <div style={{ height: 280, position: 'relative', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden' }}>
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center p-8 text-center" style={{ background: 'var(--bg-sunken)' }}>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
                        </p>
                    </div>
                ) : !hasLocation ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center" style={{ background: 'var(--bg-sunken)', gap: 8 }}>
                        <MapPin className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No location reported yet.</p>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}
            </div>
        </Card>
    );
}

// ── 2. Timeline row ────────────────────────────────────────────────────────────
function TimelineRow({ event, last }: { event: TimelineEvent; last: boolean }) {
    const icon = event.kind === 'incident'
        ? <AlertTriangle width={14} height={14} />
        : event.kind === 'departed'
            ? <Navigation width={14} height={14} />
            : <MapPin width={14} height={14} />;
    const iconColor = event.kind === 'incident' ? 'var(--danger)' : 'var(--brand)';
    const body = (
        <div style={{ paddingBottom: last ? 0 : 16, minWidth: 0 }}>
            <div className="capitalize" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                {event.label}{event.href && <ChevronLeft width={13} height={13} style={{ transform: 'rotate(180deg)', verticalAlign: 'middle', marginLeft: 2, opacity: 0.5 }} />}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{event.when}</div>
        </div>
    );
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flex: 'none' }}>
                    {icon}
                </span>
                {!last && <span style={{ flex: 1, width: 2, background: 'var(--border-subtle)', minHeight: 14, marginTop: 2 }} />}
            </div>
            {event.href
                ? <Link href={event.href} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>{body}</Link>
                : body}
        </div>
    );
}

// ── Inline sparkline + activity/battery card ─────────────────────────────────────
function SparkLine({ values, color, unit, label, format }: { values: Array<number | null>; color: string; unit: string; label: string; format?: (n: number) => string }) {
    const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
    const W = 240, H = 56, pad = 4;
    const fmt = format ?? ((n: number) => `${Math.round(n)}`);

    let chart: React.ReactNode;
    if (pts.length < 2) {
        chart = <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Not enough data yet.</p>;
    } else {
        const xs = values.length - 1;
        const min = Math.min(...pts.map(p => p.v));
        const max = Math.max(...pts.map(p => p.v));
        const range = max - min || 1;
        const x = (i: number) => pad + (i / xs) * (W - 2 * pad);
        const y = (v: number) => pad + (1 - (v - min) / range) * (H - 2 * pad);
        const line = pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
        const area = `${line} L${x(pts[pts.length - 1].i).toFixed(1)},${H - pad} L${x(pts[0].i).toFixed(1)},${H - pad} Z`;
        chart = (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
                <path d={area} fill={color} opacity="0.10" />
                <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
        );
    }

    return (
        <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
                {pts.length >= 1 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{fmt(pts[pts.length - 1].v)}{unit}</span>}
            </div>
            {chart}
        </div>
    );
}

// Reporting cadence — real points-per-hour bars (honest heartbeat stand-in; mirrors admin).
function ReportingBars({ buckets, label }: { buckets: number[]; label: string }) {
    const W = 240, H = 56, pad = 4;
    const max = Math.max(...buckets, 0);
    const total = buckets.reduce((s, n) => s + n, 0);

    let chart: React.ReactNode;
    if (buckets.length === 0 || max === 0) {
        chart = <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Not enough data yet.</p>;
    } else {
        const n = buckets.length;
        const gap = n > 60 ? 0 : 1;
        const bw = (W - 2 * pad - gap * (n - 1)) / n;
        chart = (
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
                {buckets.map((c, i) => {
                    const h = c === 0 ? 0 : Math.max(2, (c / max) * (H - 2 * pad));
                    const x = pad + i * (bw + gap);
                    return <rect key={i} x={x.toFixed(2)} y={(H - pad - h).toFixed(2)} width={Math.max(bw, 0.5).toFixed(2)} height={h.toFixed(2)} rx={bw > 3 ? 1 : 0} fill="var(--brand)" opacity={c === 0 ? 0.12 : 0.55} />;
                })}
            </svg>
        );
    }

    return (
        <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{total} pts</span>
            </div>
            {chart}
        </div>
    );
}

// Bucket trail points into per-hour counts across the whole window (quiet hours read as gaps).
function hourlyBuckets(points: TrailPoint[], hours: number): number[] {
    const now = Date.now();
    const start = now - hours * 3_600_000;
    const buckets = new Array(hours).fill(0);
    for (const p of points) {
        if (!p.t) continue;
        const ms = new Date(p.t).getTime();
        if (Number.isNaN(ms) || ms < start || ms > now) continue;
        const idx = Math.min(hours - 1, Math.floor((ms - start) / 3_600_000));
        buckets[idx] += 1;
    }
    return buckets;
}

type ActivityWindow = 24 | 168; // 24h or 7d

/* Activity, battery & reporting cadence over a window. Real telemetry only — sourced from the
   /my device trail (ApiClient.deviceTrail → GET /api/my/devices/{id}/trail?hours=N), the same
   InfluxDB-backed series the admin activity card uses. Empty trail → one friendly empty state. */
function ActivityCard({ token, deviceId, initialTrail }: { token: string; deviceId: number; initialTrail: TrailPoint[] }) {
    const [hours, setHours]     = useState<ActivityWindow>(24);
    // Seed the 24h window from the trail the page already fetched, so the chart paints instantly.
    const [points, setPoints]   = useState<TrailPoint[] | null>(initialTrail.length ? initialTrail : null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(false);
    const fetchedWide = useRef(false);

    useEffect(() => {
        // 24h is already loaded by the page; only fetch when the user expands to 7d.
        if (hours === 24 && initialTrail.length) { setPoints(initialTrail); return; }
        if (hours === 168 && fetchedWide.current && points) return;
        let cancelled = false;
        setLoading(true);
        setError(false);
        new ApiClient(token).deviceTrail(deviceId, hours)
            .then(res => {
                if (cancelled) return;
                const pts = (res.points ?? [])
                    .filter(p => p != null)
                    .map(p => ({ lat: p.lat, lng: p.lng, t: p.t, speed: p.speed, battery: p.battery ?? null }));
                setPoints(pts);
                if (hours === 168) fetchedWide.current = true;
            })
            .catch(() => { if (!cancelled) { setPoints([]); setError(true); } })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hours, deviceId, token]);

    const ordered = useMemo(
        () => [...(points ?? [])].sort((a, b) => (a.t ? new Date(a.t).getTime() : 0) - (b.t ? new Date(b.t).getTime() : 0)),
        [points],
    );
    const speeds    = ordered.map(p => p.speed);
    const batteries = ordered.map(p => p.battery);
    const buckets   = useMemo(() => hourlyBuckets(ordered, hours), [ordered, hours]);
    const hasAny    = (points?.length ?? 0) > 0;

    const toggle = (
        <div role="group" aria-label="Time window" style={{ display: 'inline-flex', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {([[24, '24h'], [168, '7d']] as const).map(([val, lbl]) => {
                const on = hours === val;
                return (
                    <button key={val} type="button" onClick={() => setHours(val)} disabled={loading}
                        style={{
                            padding: '4px 12px', cursor: loading ? 'default' : 'pointer',
                            fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                            fontFamily: 'var(--font-mono)',
                            border: 'none', background: on ? 'var(--brand)' : 'transparent',
                            color: on ? '#fff' : 'var(--text-secondary)',
                        }}>
                        {lbl}
                    </button>
                );
            })}
        </div>
    );

    return (
        <Card title="Activity & battery" action={toggle}>
            {loading && points === null ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>Loading activity…</p>
            ) : !hasAny ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 0', gap: 8 }}>
                    <Activity style={{ width: 28, height: 28, color: 'var(--text-subtle)' }} />
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
                        {error ? 'Activity data is unavailable right now.' : 'No activity data yet.'}
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 12 }}>
                        {hours === 24 ? 'Last 24 hours' : 'Last 7 days'}
                    </div>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <SparkLine values={speeds} color="var(--brand)" unit=" km/h" label="Activity (speed)" />
                        <SparkLine values={batteries} color="#1F9462" unit="%" label="Battery" />
                        <ReportingBars buckets={buckets} label="Reporting activity" />
                    </div>
                </>
            )}
        </Card>
    );
}

// ── 3. Commands ─────────────────────────────────────────────────────────────────
function CommandsCard({ token, deviceId, commands }: { token: string; deviceId: number; commands: DeviceCommand[] | null }) {
    const [sending, setSending] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ key: string; ok: boolean; msg: string } | null>(null);

    async function run(cmd: DeviceCommand) {
        setSending(cmd.key);
        setFeedback(null);
        try {
            const res = await new ApiClient(token).sendDeviceCommand(deviceId, cmd.key);
            setFeedback({ key: cmd.key, ok: true, msg: res.message || `${cmd.label} sent.` });
        } catch (err) {
            setFeedback({ key: cmd.key, ok: false, msg: (err as { message?: string })?.message?.includes('422') ? `${cmd.label} is not allowed for this device.` : `Could not send ${cmd.label}.` });
        } finally {
            setSending(null);
        }
    }

    return (
        <Card title="Commands">
            {!commands || commands.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No remote commands for this device type.</p>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {commands.map(cmd => (
                            <button key={cmd.key} onClick={() => run(cmd)} disabled={sending != null}
                                className={`tad-btn tad-btn--sm ${cmd.danger ? 'tad-btn--danger' : 'tad-btn--secondary'}`}
                                style={{ justifyContent: 'center', opacity: sending && sending !== cmd.key ? 0.5 : 1 }}>
                                <Send className="w-3.5 h-3.5" />
                                {sending === cmd.key ? 'Sending…' : cmd.label}
                            </button>
                        ))}
                    </div>
                    {feedback && (
                        <div className="mt-3 rounded-lg px-3 py-2 inline-flex items-center gap-2"
                            style={{
                                fontSize: 'var(--text-xs)',
                                color: feedback.ok ? 'var(--success)' : 'var(--danger)',
                                background: feedback.ok ? 'var(--success-bg)' : 'var(--danger-bg)',
                                border: `1px solid color-mix(in srgb, ${feedback.ok ? 'var(--success)' : 'var(--danger)'} 28%, transparent)`,
                            }}>
                            {feedback.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {feedback.msg}
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}

// ── 4. Tracking mode ──────────────────────────────────────────────────────────
function TrackingModeCard({ token, deviceId, modes, current }: { token: string; deviceId: number; modes: DeviceTrackingMode[]; current: string }) {
    const [active, setActive] = useState(current);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError]   = useState<string | null>(null);

    async function pick(mode: DeviceTrackingMode) {
        if (mode.key === active || saving) return;
        const prev = active;
        setActive(mode.key);
        setSaving(mode.key);
        setError(null);
        try {
            await new ApiClient(token).setTrackingMode(deviceId, mode.key);
        } catch {
            setActive(prev);
            setError('Could not change the tracking mode for this device.');
        } finally {
            setSaving(null);
        }
    }

    const activeMode = modes.find(m => m.key === active);

    return (
        <Card title="Tracking mode">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {modes.map(mode => {
                    const on = mode.key === active;
                    return (
                        <button key={mode.key} onClick={() => pick(mode)} disabled={saving != null}
                            style={{
                                padding: '7px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                                fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
                                border: `1px solid ${on ? 'var(--brand)' : 'var(--border)'}`,
                                background: on ? 'var(--brand)' : 'var(--surface)',
                                color: on ? '#fff' : 'var(--text)',
                            }}>
                            {saving === mode.key ? 'Saving…' : mode.label}
                        </button>
                    );
                })}
            </div>
            {activeMode && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
                    Reports every {activeMode.interval}s
                </p>
            )}
            {error && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 8 }}>{error}</p>
            )}
        </Card>
    );
}

// ── 5. Notifications — per-device SMS alerts + thresholds ──────────────────────
// Field unit is inferred from the event type: overspeed thresholds are km/h,
// low_battery thresholds are %. Both are driven entirely by threshold_fields.
function thresholdUnit(eventType: string): string {
    if (eventType === 'overspeed')   return 'km/h';
    if (eventType === 'low_battery') return '%';
    return '';
}

function thresholdFieldLabel(field: string, eventType: string): string {
    const name = field.charAt(0).toUpperCase() + field.slice(1);
    const unit = thresholdUnit(eventType);
    return unit ? `${name} (${unit})` : name;
}

function NotificationsCard({ token, deviceId }: { token: string; deviceId: number }) {
    const [prefs, setPrefs]     = useState<NotificationPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        new ApiClient(token).getNotificationPreferences(deviceId)
            .then(res => { if (!cancelled) setPrefs(res.data); })
            .catch(() => { /* leave prefs empty → empty state */ })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, deviceId]);

    function toggle(eventType: string) {
        setFeedback(null);
        setPrefs(prev => prev.map(p => p.event_type === eventType ? { ...p, sms_enabled: !p.sms_enabled } : p));
    }

    function setThreshold(eventType: string, field: string, raw: string) {
        setFeedback(null);
        const value = raw === '' ? NaN : Number(raw);
        setPrefs(prev => prev.map(p => {
            if (p.event_type !== eventType) return p;
            const next = { ...(p.thresholds ?? {}) };
            if (Number.isNaN(value)) delete next[field];
            else next[field] = value;
            return { ...p, thresholds: next };
        }));
    }

    async function save() {
        setSaving(true); setFeedback(null);
        try {
            await new ApiClient(token).updateNotificationPreferences(deviceId, prefs.map(p => ({
                event_type:  p.event_type,
                sms_enabled: p.sms_enabled,
                ...(p.threshold_fields.length > 0 ? { thresholds: p.thresholds ?? {} } : {}),
            })));
            setFeedback({ ok: true, msg: 'Notification settings saved.' });
        } catch {
            setFeedback({ ok: false, msg: 'Could not save notification settings.' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card title="Notifications">
            {loading ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading…</p>
            ) : prefs.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No alert types for this device.</p>
            ) : (
                <>
                    <p className="mb-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Choose which incidents send you an SMS, and set the thresholds that trigger them.
                    </p>
                    <div className="space-y-3">
                        {prefs.map(pref => {
                            const offUntil = pref.sms_disabled_until && new Date(pref.sms_disabled_until) > new Date();
                            const showThresholds = pref.threshold_fields.length > 0 && pref.sms_enabled;
                            return (
                                <div key={pref.event_type} className="px-3 py-2.5 rounded-xl"
                                    style={{ border: '1px solid var(--border)', background: pref.sms_enabled ? 'var(--surface)' : 'var(--surface-sunken)' }}>
                                    <div className="flex items-center gap-3">
                                        {pref.sms_enabled
                                            ? <Bell className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
                                            : <BellOff className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />}
                                        <span className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{pref.label}</span>
                                        {offUntil && <span className="shrink-0" style={{ fontSize: '9px', color: 'var(--warning)' }}>24h off</span>}
                                        <Switch checked={pref.sms_enabled} onChange={() => toggle(pref.event_type)} />
                                    </div>
                                    {showThresholds && (
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {pref.threshold_fields.map(field => (
                                                <Input
                                                    key={field}
                                                    type="number"
                                                    inputMode="numeric"
                                                    label={thresholdFieldLabel(field, pref.event_type)}
                                                    value={pref.thresholds?.[field] ?? ''}
                                                    onChange={e => setThreshold(pref.event_type, field, e.target.value)}
                                                    className="flex-1"
                                                    style={{ minWidth: 120 }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <Button size="sm" onClick={save} loading={saving}>Save notifications</Button>
                        {feedback && (
                            <span style={{ fontSize: 'var(--text-xs)', color: feedback.ok ? 'var(--brand)' : 'var(--danger)' }}>
                                {feedback.msg}
                            </span>
                        )}
                    </div>
                </>
            )}
        </Card>
    );
}

// ── Manage — rename/notes, image, beat, move-to-org, unlink ─────────────────────
function ManageCard({
    token, device, onDeviceChange, onUnlinked,
}: {
    token: string;
    device: Device;
    onDeviceChange: (d: Device) => void;
    onUnlinked: () => void;
}) {
    const api = useCallback(() => new ApiClient(token), [token]);

    // rename + notes
    const [name, setName]   = useState(device.name);
    const [notes, setNotes] = useState(device.notes ?? '');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);

    // image
    const [uploading, setUploading] = useState(false);

    // beats
    const [beats, setBeats]                 = useState<Beat[]>([]);
    const [beatBusy, setBeatBusy]           = useState(false);

    // move to org
    const [tenants, setTenants]       = useState<{ id: number; name: string }[]>([]);
    const [moveOpen, setMoveOpen]     = useState(false);
    const [moveTenantId, setMoveTenantId] = useState('');
    const [moving, setMoving]         = useState(false);
    const [moveError, setMoveError]   = useState<string | null>(null);

    // unlink
    const [unlinkConfirm, setUnlinkConfirm] = useState(false);
    const [unlinking, setUnlinking]         = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.allSettled([api().beats(), api().tenants()])
            .then(([b, t]) => {
                if (cancelled) return;
                if (b.status === 'fulfilled') setBeats(b.value.data);
                if (t.status === 'fulfilled') {
                    const list = t.value.map(x => ({ id: x.id, name: x.name }));
                    setTenants(list);
                    if (list[0]) setMoveTenantId(String(list[0].id));
                }
            });
        return () => { cancelled = true; };
    }, [api, device.id]);

    async function save() {
        setSaving(true); setError(null); setSavedMsg(false);
        try {
            const updated = await api().updateDevice(device.id, {
                name: name.trim() || device.name,
                notes: notes.trim() || null,
            });
            onDeviceChange({ ...device, ...updated });
            setSavedMsg(true);
        } catch {
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true); setError(null);
        try {
            const res = await api().uploadDeviceImage(device.id, file);
            onDeviceChange({ ...device, image_url: res.image_url });
        } catch {
            setError('Image upload failed.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    async function assignBeat(beatId: number) {
        setBeatBusy(true); setError(null);
        try {
            const { beat } = await api().assignBeat(device.id, beatId);
            onDeviceChange({ ...device, current_beat: beat });
        } catch {
            setError('Could not assign the beat.');
        } finally { setBeatBusy(false); }
    }

    async function unassignBeat() {
        setBeatBusy(true); setError(null);
        try {
            await api().unassignBeat(device.id);
            onDeviceChange({ ...device, current_beat: null });
        } catch {
            setError('Could not remove the beat.');
        } finally { setBeatBusy(false); }
    }

    async function confirmMove() {
        if (!moveTenantId) return;
        setMoving(true); setMoveError(null);
        try {
            await api().assignDeviceTenant(device.id, Number(moveTenantId));
            onUnlinked(); // device leaves the personal list once moved
        } catch (err) {
            setMoveError((err as { message?: string })?.message ?? 'Could not move the device. Please try again.');
        } finally {
            setMoving(false);
        }
    }

    async function unlink() {
        setUnlinking(true); setError(null);
        try {
            await api().unlinkDevice(device.id);
            onUnlinked();
        } catch {
            setError('Failed to unlink device. Please try again.');
            setUnlinking(false);
            setUnlinkConfirm(false);
        }
    }

    const status = getMyStatus(device);
    const moveTarget = tenants.find(t => String(t.id) === moveTenantId);

    return (
        <Card title="Manage">
            <div className="space-y-5">

                {error && (
                    <div className="rounded-lg px-3 py-2"
                        style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                        {error}
                    </div>
                )}

                {/* Image + name + notes */}
                <div className="flex gap-4">
                    <label className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
                        style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                        {device.image_url
                            ? <img src={device.image_url} alt="" className="w-full h-full object-cover" />
                            : (device.map_icon ? <span style={{ fontSize: 24 }}>{device.map_icon}</span> : <Smartphone className="w-6 h-6" />)}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                            {uploading ? <span className="text-white" style={{ fontSize: 'var(--text-2xs)' }}>…</span> : <Camera className="w-4 h-4 text-white" />}
                        </div>
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={uploadImage} disabled={uploading} />
                    </label>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div>
                            <label className="block uppercase mb-1" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Device name</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') save(); }}
                                className="tad-input w-full" style={{ height: 36, fontSize: 'var(--text-sm)' }} />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block uppercase mb-1" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Assignee / notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Add notes about this device or its assignee…"
                        className="tad-input w-full resize-none" style={{ height: 'auto', padding: '8px 12px', fontSize: 'var(--text-sm)' }} />
                </div>
                <div className="flex items-center gap-3">
                    <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
                    {savedMsg && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>Saved.</span>}
                </div>

                {/* Beat */}
                <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p className="uppercase mb-2" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Beat (geofence)</p>
                    {device.current_beat ? (
                        <div className="flex items-center gap-2 mb-2 rounded-lg px-3 py-2" style={{ border: '1px solid var(--border)' }}>
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: device.current_beat.color }} />
                            <span className="flex-1 truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{device.current_beat.name}</span>
                            <button onClick={unassignBeat} disabled={beatBusy}
                                style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: beatBusy ? 0.4 : 1 }}>
                                Remove
                            </button>
                        </div>
                    ) : (
                        <p className="mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Not assigned to any beat.</p>
                    )}
                    {beats.length > 0 && (
                        <select value={device.current_beat?.id ?? ''} disabled={beatBusy}
                            onChange={e => { const id = Number(e.target.value); if (id) assignBeat(id); }}
                            className="tad-select tad-select--sm w-full">
                            <option value="">{beatBusy ? 'Saving…' : '— Assign beat —'}</option>
                            {beats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    )}
                </div>

                {/* Status snapshot */}
                <div className="rounded-xl px-3 py-2.5 space-y-1.5" style={{ background: 'var(--surface-sunken)' }}>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_CHIP[status].dot }} />
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: STATUS_CHIP[status].color }}>{STATUS_CHIP[status].label}</span>
                        {device.battery_percent != null && (
                            <span className="ml-auto inline-flex items-center gap-1"
                                style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: device.battery_percent < 20 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                {device.battery_percent < 20 ? <BatteryLow className="w-3.5 h-3.5" /> : <Battery className="w-3.5 h-3.5" />}
                                {device.battery_percent}%
                            </span>
                        )}
                    </div>
                    {device.last_seen_at && (
                        <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>Last seen {new Date(device.last_seen_at).toLocaleString()}</p>
                    )}
                    {device.device_type && (
                        <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>Device type: {device.device_type.name}</p>
                    )}
                </div>

                {/* Move to organisation */}
                {tenants.length > 0 && (
                    <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <p className="uppercase mb-2" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Organisation</p>
                        <button onClick={() => { setMoveOpen(true); setMoveError(null); }} className="tad-btn tad-btn--secondary tad-btn--sm">
                            Move to organisation
                        </button>
                    </div>
                )}

                {/* Unlink */}
                <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {unlinkConfirm ? (
                        <div className="rounded-xl px-3 py-3 space-y-2"
                            style={{ background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)' }}>Remove this device from your account?</p>
                            <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--danger)' }}>You can re-register it later using the device ID.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setUnlinkConfirm(false)} className="tad-btn tad-btn--secondary tad-btn--sm flex-1">Cancel</button>
                                <button onClick={unlink} disabled={unlinking} className="tad-btn tad-btn--danger tad-btn--sm flex-1">{unlinking ? 'Removing…' : 'Yes, remove'}</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setUnlinkConfirm(true)} className="w-full py-1.5"
                            style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)', background: 'none', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}>
                            Unlink device
                        </button>
                    )}
                </div>
            </div>

            {/* Move-to-organisation confirm modal */}
            {moveOpen && (
                <div onClick={() => !moving && setMoveOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
                    <div onClick={e => e.stopPropagation()} className="tad-card tad-card--raised" style={{ maxWidth: 460, width: '100%' }}>
                        <div className="tad-card__body space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                                    <AlertTriangle className="w-4.5 h-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>Move to organisation</p>
                                    <p className="mt-0.5 truncate" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{device.name || 'Unnamed device'} · {device.imei}</p>
                                </div>
                            </div>
                            <div className="tad-field">
                                <label className="tad-field__label" htmlFor="move-tenant">Organisation</label>
                                <div className="tad-select-field">
                                    <select id="move-tenant" className="tad-select" value={moveTenantId} onChange={e => setMoveTenantId(e.target.value)} disabled={moving}>
                                        {tenants.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                                    </select>
                                    <span className="tad-select__chevron">
                                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-xl px-4 py-3"
                                style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)', background: 'var(--warning-bg)', border: '1px solid color-mix(in srgb, var(--warning) 28%, transparent)', lineHeight: 1.5 }}>
                                You&rsquo;ll lose personal tracking of this device — it will be visible only in <strong>{moveTarget?.name ?? 'the selected organisation'}</strong>.
                            </div>
                            {moveError && (
                                <div className="rounded-lg px-3 py-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>{moveError}</div>
                            )}
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setMoveOpen(false)} disabled={moving} className="tad-btn tad-btn--secondary tad-btn--sm">Cancel</button>
                                <button type="button" onClick={confirmMove} disabled={moving || !moveTenantId} className="tad-btn tad-btn--primary tad-btn--sm">{moving ? 'Moving…' : 'Move device'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
