'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    AlertTriangle, ChevronLeft, MapPin, Bell, CheckCircle2, ShieldCheck, History,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { IncidentDetail, IncidentTimelineStage } from '@/lib/api-client';
import { Card } from '@/components/ui';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// ── Badge palettes (mirror the incidents list view) ───────────────────────────
const STATUS_BADGE: Record<string, { background: string; color: string }> = {
    open:         { background: 'var(--danger-bg)',  color: 'var(--danger)' },
    acknowledged: { background: 'var(--warning-bg)', color: 'var(--warning)' },
    escalated:    { background: 'var(--warning-bg)', color: 'var(--warning)' },
    resolved:     { background: 'var(--success-bg)', color: 'var(--success)' },
};

const PRIORITY_BADGE: Record<string, { background: string; color: string }> = {
    critical: { background: 'var(--danger-bg)',  color: 'var(--danger)' },
    high:     { background: 'var(--warning-bg)', color: 'var(--warning)' },
    medium:   { background: 'var(--warning-bg)', color: 'var(--warning)' },
    low:      { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' },
};

const STATUS_DOT: Record<string, string> = {
    open:         'var(--danger)',
    acknowledged: 'var(--warning)',
    escalated:    'var(--warning)',
    resolved:     'var(--success)',
    closed:       'var(--text-muted)',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function humanizeEventType(raw: string): string {
    const acronyms: Record<string, string> = { sos: 'SOS', gps: 'GPS', sim: 'SIM' };
    return raw
        .split(/[_\s]+/)
        .map(w => acronyms[w.toLowerCase()] ?? (w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
}

function fmtWhen(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtRelative(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const mins = Math.round(diff / 60_000);
    if (mins < 1)    return 'Just now';
    if (mins < 60)   return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24)    return `${hrs} hr ago`;
    const days = Math.round(hrs / 24);
    if (days < 30)   return `${days} day${days === 1 ? '' : 's'} ago`;
    return fmtWhen(iso);
}

const STAGE_ICON: Record<IncidentTimelineStage['key'], React.ReactNode> = {
    triggered:    <AlertTriangle width={14} height={14} />,
    acknowledged: <Bell width={14} height={14} />,
    resolved:     <CheckCircle2 width={14} height={14} />,
};
const STAGE_COLOR: Record<IncidentTimelineStage['key'], string> = {
    triggered:    'var(--danger)',
    acknowledged: 'var(--warning)',
    resolved:     'var(--success)',
};

export default function IncidentDetailClient({ incidentId }: { incidentId: number }) {
    const { token } = useAuth();

    const [incident, setIncident] = useState<IncidentDetail | null>(null);
    const [loading, setLoading]   = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        setLoading(true);
        new ApiClient(token).getIncident(incidentId)
            .then(data => { if (!cancelled) setIncident(data); })
            .catch(() => { if (!cancelled) setLoadError('We could not load this incident.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, incidentId]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    if (loading) {
        return null; // the portal LoadingProvider overlay covers this area
    }

    if (!incident) {
        return (
            <div className="mx-auto max-w-3xl px-6 py-8 space-y-4">
                <Link href="/my/incidents" className="inline-flex items-center gap-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    <ChevronLeft className="w-4 h-4" /> Incidents
                </Link>
                <Card>
                    <div className="flex flex-col items-center text-center py-8" style={{ gap: 10 }}>
                        <AlertTriangle className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{loadError ?? 'Incident not found.'}</p>
                    </div>
                </Card>
            </div>
        );
    }

    const statusBadge   = STATUS_BADGE[incident.status] ?? PRIORITY_BADGE.low;
    const priorityBadge = PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low;

    const lat = incident.latitude != null ? Number(incident.latitude) : null;
    const lng = incident.longitude != null ? Number(incident.longitude) : null;
    const coords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
        ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        : 'No location';

    const trail = incident.locations
        .filter(p => p.latitude != null && p.longitude != null)
        .map(p => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-5 sm:px-6 sm:py-8">

            {/* Back link */}
            <Link href="/my/incidents" className="inline-flex items-center gap-1"
                style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-muted)', textDecoration: 'none' }}>
                <ChevronLeft className="w-4 h-4" /> Incidents
            </Link>

            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center sm:w-14 sm:h-14"
                    style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
                            {incident.display_label ?? humanizeEventType(incident.event_type)}
                        </h1>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[incident.status] ?? 'var(--text-muted)' }} />
                        <span className="capitalize px-2 py-0.5 rounded-full"
                            style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...statusBadge }}>
                            {incident.status}
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded-full"
                            style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...priorityBadge }}>
                            {incident.priority}
                        </span>
                    </div>
                    <p className="truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 3 }}>
                        {incident.device?.name ?? 'Unknown device'}
                    </p>
                    <p className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>
                        {incident.device?.imei ?? '—'} · {fmtWhen(incident.triggered_at)}
                    </p>
                </div>
            </div>

            {/* 1 ── Location map */}
            <IncidentMapCard lat={lat} lng={lng} coords={coords} trail={trail} deviceName={incident.device?.name ?? 'Incident'} />

            {/* 2 ── Lifecycle timeline */}
            <Card title="Lifecycle">
                {incident.timeline.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-6" style={{ gap: 8 }}>
                        <AlertTriangle className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No lifecycle events recorded.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {incident.timeline.map((stage, i) => (
                            <TimelineRow key={stage.key} stage={stage} last={i === incident.timeline.length - 1} />
                        ))}
                    </div>
                )}
            </Card>

            {/* 3 ── Resolution notes (when present) */}
            {incident.resolution_notes && (
                <Card title="Resolution notes">
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {incident.resolution_notes}
                    </p>
                </Card>
            )}

            {/* 4 ── Past occurrences */}
            <Card title="Past occurrences">
                {incident.history.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-6" style={{ gap: 8 }}>
                        <ShieldCheck className="w-7 h-7" style={{ color: 'var(--success)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No earlier occurrences of this alert.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {incident.history.map(h => {
                            const hStatus   = STATUS_BADGE[h.status] ?? PRIORITY_BADGE.low;
                            return (
                                <Link key={h.id} href={`/my/incidents/${h.id}`}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', textDecoration: 'none' }}>
                                    <History className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                    <span className="flex-1 min-w-0" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                        {fmtRelative(h.triggeredAt)}
                                    </span>
                                    <span className="capitalize px-2 py-0.5 rounded-full shrink-0"
                                        style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...hStatus }}>
                                        {h.status}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}

// ── 1. Incident location map ────────────────────────────────────────────────────
function IncidentMapCard({ lat, lng, coords, trail, deviceName }: {
    lat: number | null;
    lng: number | null;
    coords: string;
    trail: Array<{ lat: number; lng: number }>;
    deviceName: string;
}) {
    const mapRef  = useRef<HTMLDivElement>(null);
    const gmapRef = useRef<google.maps.Map | null>(null);
    const [ready, setReady] = useState(false);

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

    // Init / sync the incident map: one marker at the incident + the captured trail polyline.
    useEffect(() => {
        if (!ready || !mapRef.current || !hasLocation) return;
        const center = { lat: lat!, lng: lng! };

        if (!gmapRef.current) {
            gmapRef.current = new google.maps.Map(mapRef.current, {
                center,
                zoom: 16,
                mapId: 'my-incident-detail-map',
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
            });
        } else {
            gmapRef.current.panTo(center);
        }
        const map = gmapRef.current;

        // Marker (small danger-coloured dot)
        const dot = document.createElement('div');
        dot.style.cssText = 'width:11px;height:11px;border-radius:50%;background:#F0463C;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AdvMarker = (google.maps as any).marker?.AdvancedMarkerElement;
        let marker: { setMap: (m: google.maps.Map | null) => void };
        if (AdvMarker) {
            marker = new AdvMarker({ map, position: center, content: dot });
        } else {
            marker = new google.maps.Marker({
                position: center, map, title: deviceName,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#F0463C', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
            }) as unknown as { setMap: (m: google.maps.Map | null) => void };
        }

        // Trail polyline — keep the view close on the incident (no fit-to-bounds, which zooms out).
        let line: google.maps.Polyline | null = null;
        if (trail.length >= 2) {
            line = new google.maps.Polyline({
                path: trail, map, geodesic: true,
                strokeColor: '#01411C', strokeOpacity: 0.85, strokeWeight: 3,
            });
        }

        return () => { marker.setMap(null); line?.setMap(null); };
    }, [ready, hasLocation, lat, lng, trail, deviceName]);

    return (
        <Card title="Location" flushBody>
            <div style={{ height: 320, position: 'relative', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden' }}>
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center p-8 text-center" style={{ background: 'var(--bg-sunken)' }}>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
                        </p>
                    </div>
                ) : !hasLocation ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center" style={{ background: 'var(--bg-sunken)', gap: 8 }}>
                        <MapPin className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No location recorded for this incident.</p>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}
            </div>
            {hasLocation && (
                <div className="px-5 py-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{coords}</span>
                </div>
            )}
        </Card>
    );
}

// ── 2. Timeline row ─────────────────────────────────────────────────────────────
function TimelineRow({ stage, last }: { stage: IncidentTimelineStage; last: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: STAGE_COLOR[stage.key], flex: 'none' }}>
                    {STAGE_ICON[stage.key]}
                </span>
                {!last && <span style={{ flex: 1, width: 2, background: 'var(--border-subtle)', minHeight: 14, marginTop: 2 }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : 16, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{stage.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{fmtWhen(stage.at)}</div>
            </div>
        </div>
    );
}
