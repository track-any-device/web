'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Plus, Smartphone, MapPin, Upload, CheckCircle2, Route, ChevronRight, AlertTriangle, Pencil, X } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident, Beat } from '@/lib/api-client';
import { Badge, Card, Button } from '@/components/ui';
import { DeviceSummaryCard } from './[id]/device-summary-card';
import ImportBeatsModal from '../beats/import-beats-modal';
import {
    arrowRotation,
    useArrow,
} from '@/lib/map-markers';

type DevicesTab = 'assets' | 'beats' | 'trips';

interface Props {
    devices:            Device[];
    incidents:          Incident[];
    initialBeats:       Beat[];
    token:              string;
    realtimeConnected?: boolean;
    onRegisterClick:    () => void;
    /** Which left-column tab is active. /my/devices → assets, /my/beats → beats, /my/trips → trips. */
    initialTab?:        DevicesTab;
}

// The three left-column views are the SAME page on different routes. The pills are real
// <Link>s so each tab has its own URL; the active one is derived from the current pathname.
const TAB_LINKS: { value: DevicesTab; label: string; href: string }[] = [
    { value: 'assets', label: 'Assets', href: '/my/devices' },
    { value: 'beats',  label: 'Beats',  href: '/my/beats' },
];

const MAPS_KEY    = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const API_URL_PUB = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

const ARROW_SIZE = 32;
const PIN_SIZE   = 18;

const PRIORITY_BADGE: Record<string, { background: string; color: string }> = {
    critical: { background: 'var(--danger-bg)',  color: 'var(--danger)' },
    high:     { background: 'var(--warning-bg)', color: 'var(--warning)' },
    medium:   { background: 'var(--warning-bg)', color: 'var(--warning)' },
    low:      { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' },
};

const INCIDENT_STATUS_DOT: Record<string, string> = {
    open:         'var(--danger)',
    acknowledged: 'var(--warning)',
    escalated:    'var(--warning)',
    resolved:     'var(--success)',
    closed:       'var(--text-muted)',
};

type MyStatus = 'online' | 'offline' | 'unavailable';

function getMyStatus(device: Device): MyStatus {
    if (!device.last_seen_at) return 'unavailable';
    const mins = (Date.now() - new Date(device.last_seen_at).getTime()) / 60_000;
    if (mins <= 30)   return 'online';
    if (mins <= 1440) return 'offline';
    return 'unavailable';
}

// Customer-facing status wording for the pinned selected-device card (mirrors the detail page).
const STATUS_CHIP: Record<MyStatus, { label: string; color: string }> = {
    online:      { label: 'Moving',  color: 'var(--success)' },
    offline:     { label: 'Idle',    color: 'var(--warning)' },
    unavailable: { label: 'Offline', color: 'var(--text-muted)' },
};

// Incidents are loaded in pages of this size as the list is scrolled (infinite scroll).
const INCIDENTS_PER_PAGE = 20;

// Live metric shown under an OPEN incident (open/acknowledged/escalated): overspeed → current
// speed, low_battery → current battery, beat_violation → current distance from the assigned beat.
// Returns null when the incident is closed, has no `current`, or the relevant value is missing.
const ACTIVE_INCIDENT_STATUSES = ['open', 'acknowledged', 'escalated'];

function renderLiveMetric(incident: Incident) {
    if (!ACTIVE_INCIDENT_STATUSES.includes(incident.status)) return null;
    const current = incident.current;
    if (!current) return null;

    let value: string | null = null;
    let unit = '';

    if (incident.event_type === 'overspeed' && current.speed != null) {
        value = current.speed.toFixed(0);
        unit = 'km/h';
    } else if (incident.event_type === 'low_battery' && current.battery != null) {
        value = String(current.battery);
        unit = '%';
    } else if (incident.event_type === 'beat_violation' && current.distanceM != null) {
        const m = current.distanceM;
        if (m < 1000) {
            value = m.toFixed(0);
            unit = 'm from beat';
        } else {
            value = (m / 1000).toFixed(1);
            unit = 'km from beat';
        }
    }

    if (value == null) return null;

    return (
        <div style={{ marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
    );
}

// Map-pin colour reflects the device's LIVE status (not battery): online = green, offline = red,
// unavailable = sand. Concrete hex (matches --success / --danger / --text-muted) so it resolves
// even if Google reparents the marker content outside the .tad scope.
const STATUS_PIN: Record<MyStatus, string> = {
    online: '#1F9462', offline: '#F0463C', unavailable: '#8A7E6C',
};
const STATUS_ARROW: Record<MyStatus, string> = {
    online: '/map-arrows/map-arrow-green.png',
    offline: '/map-arrows/map-arrow-red.png',
    unavailable: '/map-arrows/map-arrow-red.png',
};

// ── Auto-detected trip (shape from ApiClient.deviceTrips) ──────────────────────
type Trip = {
    id:         number;
    startedAt:  string | null;
    endedAt:    string | null;
    durationS:  number | null;
    distanceM:  number;
    distanceKm: number;
    maxSpeed:   number | null;
    points:     number;
    start:      { lat: number; lng: number };
    end:        { lat: number; lng: number } | null;
};

// Format a trip start time as "Today 08:42" / "Yesterday 18:10" / "Mon 06:05".
function formatTripWhen(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const dayDiff = Math.round((startOf(today) - startOf(d)) / 86_400_000);
    if (dayDiff === 0) return `Today ${time}`;
    if (dayDiff === 1) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { weekday: 'short' })} ${time}`;
}

// Format a duration in seconds as "X min" or "Xh Ym".
function formatTripDuration(s: number | null): string {
    if (s == null || s < 0) return '—';
    const mins = Math.round(s / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Compact coordinate label for a trip endpoint.
function formatTripCoords(p: { lat: number; lng: number } | null): string {
    if (!p) return 'In progress';
    return `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`;
}

// Build the marker DOM. The element is re-created whenever the device updates (see the marker
// sync effect), so the one-shot `tad-pin-ping` ring replays on every update; online devices also
// carry a continuous `tad-pin-pulse` halo so a live device visibly breathes on the map.
function makeMarkerElement(device: Device, selected = false): HTMLElement {
    const status  = getMyStatus(device);
    const color   = STATUS_PIN[status];
    // heading not yet in Device type — read it loosely; will be null until the API adds it.
    const heading: number | null = (device as { heading?: number }).heading ?? null;
    const arrow   = useArrow(heading);
    const dotSize = selected ? PIN_SIZE + 8 : PIN_SIZE;
    const box     = arrow ? ARROW_SIZE : dotSize;
    const ring    = arrow ? Math.round(ARROW_SIZE * 0.55) : dotSize;

    const wrap = document.createElement('div');
    wrap.title = device.name;
    wrap.style.cssText = `position:relative;display:flex;align-items:center;justify-content:center;width:${box}px;height:${box}px;cursor:pointer`;

    // one-shot ping (replays on each re-create == each update)
    const ping = document.createElement('div');
    ping.style.cssText = `position:absolute;left:50%;top:50%;width:${ring}px;height:${ring}px;margin:${-ring / 2}px 0 0 ${-ring / 2}px;border-radius:50%;border:2px solid ${color};animation:tad-pin-ping .9s ease-out;pointer-events:none`;
    wrap.appendChild(ping);

    // continuous live pulse for online devices
    if (status === 'online') {
        const halo = document.createElement('div');
        halo.style.cssText = `position:absolute;left:50%;top:50%;width:${ring}px;height:${ring}px;margin:${-ring / 2}px 0 0 ${-ring / 2}px;border-radius:50%;background:${color};opacity:.4;animation:tad-pin-pulse 1.8s ease-out infinite;pointer-events:none`;
        wrap.appendChild(halo);
    }

    if (arrow) {
        const img = document.createElement('img');
        img.src = STATUS_ARROW[status];
        img.width = ARROW_SIZE;
        img.height = ARROW_SIZE;
        img.style.cssText = `position:relative;display:block;transform-origin:center center;transform:${arrowRotation(heading)};filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))`;
        wrap.appendChild(img);
    } else {
        const dot = document.createElement('div');
        dot.style.cssText = `position:relative;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color};border:${selected ? 3 : 2.5}px solid #fff;box-shadow:${selected ? `0 0 0 2px ${color}, ` : ''}0 1px 4px rgba(0,0,0,.35)`;
        wrap.appendChild(dot);
    }

    return wrap;
}

function makeSelectedMarkerElement(device: Device): HTMLElement {
    return makeMarkerElement(device, true);
}

export default function DevicesView({
    devices: incomingDevices,
    incidents,
    initialBeats,
    token,
    realtimeConnected,
    onRegisterClick,
    initialTab = 'assets',
}: Props) {
    const router   = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // Active tab follows the URL; fall back to the prop on first render.
    const activeTab: DevicesTab =
        pathname?.startsWith('/my/beats') ? 'beats'
        : pathname?.startsWith('/my/trips') ? 'trips'
        : pathname?.startsWith('/my/devices') ? 'assets'
        : initialTab;

    const [devices,         setDevices]         = useState<Device[]>(incomingDevices);
    const [beats,           setBeats]           = useState<Beat[]>(initialBeats);
    const [selectedDev,     setSelectedDev]     = useState<number | null>(null);
    const [selectedBeat,    setSelectedBeat]    = useState<number | null>(null);
    const [mapsReady,       setMapsReady]       = useState(false);
    const [showImport,      setShowImport]      = useState(false);

    // Mobile-only: which single pane is shown (the desktop lg+ layout shows both columns at once).
    // 'list' = the LEFT column (device list + selected card + incidents, or the Beats list) ·
    // 'map'  = the RIGHT column (live map + trail/trip playback). Incidents no longer have their
    // own pane — they live under the device list, matching the new two-column desktop layout.
    type MobilePane = 'list' | 'map';
    // Map is the default mobile pane. Section links carry ?view=list so tapping Devices/Beats
    // (which remounts this page on a route change) lands on the list, not back on the map.
    const [mobilePane, setMobilePane] = useState<MobilePane>(
        searchParams.get('view') === 'list' || activeTab === 'beats' ? 'list' : 'map',
    );

    // Left "Trips" tab: auto-detected trips for the selected device
    const [trips,           setTrips]           = useState<Trip[]>([]);
    const [tripsLoading,    setTripsLoading]    = useState(false);

    const mapRef      = useRef<HTMLDivElement>(null);
    const gmapRef     = useRef<google.maps.Map | null>(null);
    const markersRef  = useRef<Map<number, { setMap: (m: google.maps.Map | null) => void; addListener?: (ev: string, fn: () => void) => void; position?: { lat: number; lng: number } }>>(new Map());
    const markerSigRef = useRef<Map<number, string>>(new Map());
    const polysRef    = useRef<Map<number, google.maps.Polygon>>(new Map());
    const trailRef    = useRef<google.maps.Polyline | null>(null);
    const [showTrail,  setShowTrail]  = useState(false);
    const [trailEmpty, setTrailEmpty] = useState(false);
    const [showBeats,  setShowBeats]  = useState(true);
    const beatsRef    = useRef<Beat[]>(initialBeats);

    // ── Incidents list with infinite scroll ───────────────────────────────────
    // Default scope is ALL devices' incidents; selecting a device filters server-side
    // (device_id). The `incidents` prop seeds page 1 (already fetched by the parent), and
    // further pages are pulled from ApiClient.incidents() as the sentinel scrolls into view.
    // A selected beat narrows the seeded list client-side (no beat_id round-trip needed).
    const [incidentItems,   setIncidentItems]   = useState<Incident[]>(incidents);
    const [incidentPage,    setIncidentPage]    = useState(1);
    const [incidentHasMore, setIncidentHasMore] = useState(incidents.length >= INCIDENTS_PER_PAGE);
    const [incidentLoading, setIncidentLoading] = useState(false);
    const incidentSentinelRef = useRef<HTMLDivElement>(null);

    // The list the UI renders. When a beat is selected we filter the loaded set client-side;
    // a selected device is already filtered server-side, so the loaded set IS the device's set.
    const visibleIncidents = selectedBeat
        ? incidentItems.filter(i => i.beat?.id === selectedBeat)
        : incidentItems;

    // ── Load Google Maps (with marker library for AdvancedMarkerElement) ──────
    useEffect(() => {
        if (typeof google !== 'undefined' && google.maps) { setMapsReady(true); return; }
        if (!MAPS_KEY) return;
        const s   = document.createElement('script');
        s.src     = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=marker`;
        s.async   = true;
        s.onload  = () => setMapsReady(true);
        document.head.appendChild(s);
    }, []);

    // ── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapsReady || !mapRef.current || gmapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
            center:               { lat: 31.5204, lng: 74.3587 },
            zoom:                 10,
            mapId:                'my-devices-map',          // required for AdvancedMarkerElement
            fullscreenControl:    false,
            streetViewControl:    false,
            mapTypeControl:       false,
        });
        gmapRef.current = map;

        const bounds    = new google.maps.LatLngBounds();
        let   hasBounds = false;

        // Device markers
        devices.filter(d => d.last_lat != null && d.last_lon != null).forEach(device => {
            const lat = Number(device.last_lat);
            const lng = Number(device.last_lon);
            if (isNaN(lat) || isNaN(lng)) return;

            const marker = createAdvancedMarker(map, device, false);
            marker.addListener?.('click', () => selectDevice(device.id, map));
            markersRef.current.set(device.id, marker);
            bounds.extend({ lat, lng });
            hasBounds = true;
        });

        // Beat polygons
        beats.forEach(beat => {
            if (!beat.coordinates?.length) return;
            const poly = new google.maps.Polygon({
                paths:        beat.coordinates,
                fillColor:    beat.color ?? '#01411C',
                fillOpacity:  0.15,
                strokeColor:  beat.color ?? '#01411C',
                strokeWeight: 2,
                map,
            });
            polysRef.current.set(beat.id, poly);
            poly.addListener('click', () => focusBeat(beat.id));
            beat.coordinates.forEach(v => { bounds.extend(v); hasBounds = true; });
        });

        if (hasBounds) map.fitBounds(bounds, 80);
    }, [mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Sync incoming device updates (realtime) ───────────────────────────────
    useEffect(() => {
        setDevices(prev => {
            const prevMap = Object.fromEntries(prev.map(d => [d.id, d]));
            return incomingDevices.map(incoming => ({
                ...incoming,
                name:      prevMap[incoming.id]?.name      ?? incoming.name,
                map_icon:  prevMap[incoming.id]?.map_icon  ?? incoming.map_icon,
                notes:     prevMap[incoming.id]?.notes     ?? incoming.notes,
                image_url: prevMap[incoming.id]?.image_url ?? incoming.image_url,
            }));
        });
    }, [incomingDevices]);

    // ── Update markers when positions/status change ───────────────────────────
    useEffect(() => {
        if (!gmapRef.current || !mapsReady) return;
        const map = gmapRef.current;

        devices.forEach(device => {
            const lat        = Number(device.last_lat);
            const lng        = Number(device.last_lon);
            const isSelected = selectedDev === device.id;
            const existing   = markersRef.current.get(device.id);

            // Only re-create the marker content when something actually changed (position, last
            // seen, battery, or selection). That keeps the ping animation meaningful — it fires on
            // a real update, not for every marker whenever any device changes.
            const sig = `${lat}|${lng}|${device.last_seen_at ?? ''}|${device.battery_percent ?? ''}|${isSelected ? 1 : 0}`;

            if (existing) {
                if (markerSigRef.current.get(device.id) !== sig) {
                    if ('content' in existing) {
                        (existing as { content: HTMLElement }).content = isSelected
                            ? makeSelectedMarkerElement(device)
                            : makeMarkerElement(device);
                    }
                    if (!isNaN(lat) && !isNaN(lng) && 'position' in existing) {
                        (existing as { position: { lat: number; lng: number } }).position = { lat, lng };
                    }
                    markerSigRef.current.set(device.id, sig);
                }
            } else if (!isNaN(lat) && !isNaN(lng)) {
                const marker = createAdvancedMarker(map, device, isSelected);
                marker.addListener?.('click', () => selectDevice(device.id));
                markersRef.current.set(device.id, marker);
                markerSigRef.current.set(device.id, sig);
            }

            // Follow selected device — pan when it moves outside the visible area
            if (isSelected && !isNaN(lat) && !isNaN(lng)) {
                const bounds = map.getBounds();
                if (!bounds || !bounds.contains({ lat, lng })) {
                    map.panTo({ lat, lng });
                }
            }
        });
    }, [devices, selectedDev, mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Trail: draw the selected device's recent path when "Show trail" is on ──
    useEffect(() => {
        const map = gmapRef.current;
        if (!map || !mapsReady) return;

        const clear = () => { trailRef.current?.setMap(null); trailRef.current = null; };

        if (!showTrail || !selectedDev) { clear(); setTrailEmpty(false); return; }

        let cancelled = false;
        (async () => {
            try {
                const res = await new ApiClient(token).deviceTrail(selectedDev, 24);
                if (cancelled) return;
                const path = res.points
                    .filter(p => p.lat != null && p.lng != null)
                    .map(p => ({ lat: p.lat, lng: p.lng }));
                clear();
                if (path.length < 2) { setTrailEmpty(true); return; }
                setTrailEmpty(false);
                trailRef.current = new google.maps.Polyline({
                    path, map: gmapRef.current, geodesic: true,
                    strokeColor: '#01411C', strokeOpacity: 0.85, strokeWeight: 3,
                });
            } catch { /* trail unavailable — leave the map as-is */ }
        })();

        return () => { cancelled = true; };
    }, [showTrail, selectedDev, mapsReady, token]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load auto-detected trips for the selected device (right "Trips" tab) ──
    useEffect(() => {
        if (selectedDev == null) { setTrips([]); return; }
        let cancelled = false;
        setTripsLoading(true);
        new ApiClient(token).deviceTrips(selectedDev)
            .then(res => { if (!cancelled) setTrips(res.trips ?? []); })
            .catch(() => { if (!cancelled) setTrips([]); })
            .finally(() => { if (!cancelled) setTripsLoading(false); });
        return () => { cancelled = true; };
    }, [selectedDev, token]);

    // ── Incidents: (re)seed page 1 when the scope changes ─────────────────────
    // No device selected → use the prop the parent already fetched (all devices, last 3 days).
    // Device selected → fetch that device's incidents (page 1) server-side so we don't depend on
    // the prop having included them. Either way this resets the infinite-scroll cursor.
    useEffect(() => {
        if (selectedDev == null) {
            setIncidentItems(incidents);
            setIncidentPage(1);
            setIncidentHasMore(incidents.length >= INCIDENTS_PER_PAGE);
            return;
        }
        let cancelled = false;
        setIncidentLoading(true);
        new ApiClient(token)
            .incidents({ device_id: String(selectedDev), days: '3', page: '1', per_page: String(INCIDENTS_PER_PAGE) })
            .then(res => {
                if (cancelled) return;
                setIncidentItems(res.data);
                setIncidentPage(res.current_page);
                setIncidentHasMore(res.current_page < res.last_page);
            })
            .catch(() => {
                if (cancelled) return;
                // Fall back to the already-loaded set filtered to this device — never invent rows.
                setIncidentItems(incidents.filter(i => i.device?.id === selectedDev));
                setIncidentHasMore(false);
            })
            .finally(() => { if (!cancelled) setIncidentLoading(false); });
        return () => { cancelled = true; };
    }, [selectedDev, incidents, token]);

    // ── Incidents: load the next page when the sentinel scrolls into view ─────
    const loadMoreIncidents = useCallback(() => {
        if (incidentLoading || !incidentHasMore) return;
        const next = incidentPage + 1;
        setIncidentLoading(true);
        new ApiClient(token)
            .incidents({
                ...(selectedDev != null ? { device_id: String(selectedDev) } : {}),
                days: '3', page: String(next), per_page: String(INCIDENTS_PER_PAGE),
            })
            .then(res => {
                setIncidentItems(prev => {
                    const seen = new Set(prev.map(i => i.id));
                    return [...prev, ...res.data.filter(i => !seen.has(i.id))];
                });
                setIncidentPage(res.current_page);
                setIncidentHasMore(res.current_page < res.last_page);
            })
            .catch(() => setIncidentHasMore(false))
            .finally(() => setIncidentLoading(false));
    }, [incidentLoading, incidentHasMore, incidentPage, selectedDev, token]);

    useEffect(() => {
        const el = incidentSentinelRef.current;
        if (!el || !incidentHasMore) return;
        const io = new IntersectionObserver(
            entries => { if (entries[0]?.isIntersecting) loadMoreIncidents(); },
            { rootMargin: '200px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [incidentHasMore, loadMoreIncidents]);

    // ── Mobile: when the map pane becomes visible, Google needs a resize nudge ──
    // (it was laid out at 0×0 while hidden behind the List/Alerts pane). Re-center
    // on the current selection or refit so the tiles fill the now-visible pane.
    useEffect(() => {
        if (mobilePane !== 'map') return;
        const map = gmapRef.current;
        if (!map || !mapsReady) return;
        const id = window.setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
            const sel = selectedDev != null ? devices.find(d => d.id === selectedDev) : null;
            const lat = sel ? Number(sel.last_lat) : NaN;
            const lng = sel ? Number(sel.last_lon) : NaN;
            if (!isNaN(lat) && !isNaN(lng)) map.panTo({ lat, lng });
        }, 60);
        return () => window.clearTimeout(id);
    }, [mobilePane, mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Create AdvancedMarkerElement with graceful fallback ───────────────────
    function createAdvancedMarker(
        map: google.maps.Map,
        device: Device,
        selected: boolean,
    ): ReturnType<typeof markersRef.current.get> & object {
        const lat = Number(device.last_lat);
        const lng = Number(device.last_lon);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AdvMarker = (google.maps as any).marker?.AdvancedMarkerElement as
            | (new (o: object) => object & { addListener?: (ev: string, fn: () => void) => void; setMap: (m: google.maps.Map | null) => void; content: HTMLElement; position: { lat: number; lng: number } })
            | undefined;

        const content = selected ? makeSelectedMarkerElement(device) : makeMarkerElement(device);

        if (AdvMarker) {
            return new AdvMarker({ map, position: { lat, lng }, content });
        }

        // Fallback to legacy Marker
        const color = STATUS_PIN[getMyStatus(device)];
        const mk    = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: device.name,
            icon: {
                path:         google.maps.SymbolPath.CIRCLE,
                scale:        selected ? 11 : 8,
                fillColor:    color,
                fillOpacity:  1,
                strokeColor:  '#fff',
                strokeWeight: selected ? 3 : 2,
            },
        });
        return mk as unknown as ReturnType<typeof markersRef.current.get> & object;
    }

    // ── Select a device (highlight + pan map, no drawer) ──────────────────────
    const selectDevice = useCallback((id: number, map?: google.maps.Map) => {
        const m      = map ?? gmapRef.current;
        const device = devices.find(d => d.id === id);
        if (!device) return;

        // Pan map to device
        if (m) {
            const lat = Number(device.last_lat);
            const lng = Number(device.last_lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                m.panTo({ lat, lng });
                // Animate in close on the selected device.
                if ((m.getZoom() ?? 10) < 16) setTimeout(() => m.setZoom(16), 220);
            }
        }

        setSelectedDev(id);
        setSelectedBeat(null);
        // On phones the list and map are separate panes — jump to the map so the pin is visible.
        setMobilePane('map');
        document.getElementById(`device-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [devices]);

    // ── Navigate to the full device-details page ──────────────────────────────
    const goToDevice = useCallback((id: number) => {
        router.push(`/my/devices/${id}`);
    }, [router]);

    // Keep beatsRef current so polygon click listeners always see the latest beats
    useEffect(() => { beatsRef.current = beats; }, [beats]);

    // ── Sync beat polygons when beats state changes (e.g. after import) ──────
    useEffect(() => {
        const map = gmapRef.current;
        if (!map || !mapsReady) return;

        const beatIds = new Set(beats.map(b => b.id));

        // Remove polygons for beats that no longer exist
        polysRef.current.forEach((poly, id) => {
            if (!beatIds.has(id)) {
                poly.setMap(null);
                polysRef.current.delete(id);
            }
        });

        // Add polygons for newly added beats (respect the current show/hide toggle)
        const newBeats = beats.filter(b => !polysRef.current.has(b.id) && (b.coordinates?.length ?? 0) > 0);
        newBeats.forEach(beat => {
            const poly = new google.maps.Polygon({
                paths:        beat.coordinates,
                fillColor:    beat.color ?? '#01411C',
                fillOpacity:  0.15,
                strokeColor:  beat.color ?? '#01411C',
                strokeWeight: 2,
                map:          showBeats ? map : null,
            });
            polysRef.current.set(beat.id, poly);
            poly.addListener('click', () => focusBeat(beat.id));
        });

        // Pan to newly added beats
        if (newBeats.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            newBeats.forEach(beat => beat.coordinates.forEach(v => bounds.extend(v)));
            map.fitBounds(bounds, 80);
        }
    }, [beats, mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Show / hide beat polygons (does not rebuild them, just toggles visibility) ──
    useEffect(() => {
        const map = gmapRef.current;
        if (!map || !mapsReady) return;
        polysRef.current.forEach(poly => poly.setMap(showBeats ? map : null));
    }, [showBeats, mapsReady]);

    // ── Reload beats (after import) ───────────────────────────────────────────
    function loadBeats() {
        new ApiClient(token).beats()
            .then(res => setBeats(res.data))
            .catch(() => {});
    }

    // ── Focus beat on map ─────────────────────────────────────────────────────
    function focusBeat(id: number) {
        const currentBeats = beatsRef.current;
        polysRef.current.forEach((p, pid) => {
            const b = currentBeats.find(x => x.id === pid);
            p.setOptions({ fillOpacity: 0.15, strokeWeight: 2, strokeColor: b?.color ?? '#01411C', fillColor: b?.color ?? '#01411C', zIndex: 1 });
        });
        const poly = polysRef.current.get(id);
        if (poly) poly.setOptions({ fillOpacity: 0.35, strokeWeight: 3, zIndex: 10 });

        const beat = currentBeats.find(b => b.id === id);
        const m    = gmapRef.current;
        if (beat?.coordinates?.length && m) {
            const b = new google.maps.LatLngBounds();
            beat.coordinates.forEach(v => b.extend(v));
            m.panTo(b.getCenter());
            setTimeout(() => m.fitBounds(b, 80), 300);
        }

        setSelectedBeat(id);
        setSelectedDev(null);
        // On phones the list and map are separate panes — jump to the map so the zone is visible.
        setMobilePane('map');
        document.getElementById(`beat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Derived view data (presentation only) ────────────────────────────────
    const selectedDevice  = selectedDev != null ? devices.find(d => d.id === selectedDev) ?? null : null;
    // "New" = still-active incidents (open / acknowledged / escalated) across the visible set.
    const newIncidentCount = visibleIncidents.filter(i =>
        ['open', 'acknowledged', 'escalated'].includes(i.status)).length;

    const selectedStatus  = selectedDevice ? getMyStatus(selectedDevice) : null;

    return (
        // Fills the full-bleed <main> (flex:1; minHeight:0). On phones/tablets it's a single
        // flex column with a Map⇄Devices⇄Beats segmented control swapping one pane at a time; at
        // lg+ it switches to a TWO-column split: LEFT = slim device list + the pinned selected-device
        // card + the infinite-scroll incidents list · RIGHT = the live map + trail/trip playback.
        <div
            className="tad flex min-h-0 w-full flex-1 flex-col lg:mx-auto lg:block lg:max-w-[1240px] lg:px-7 lg:py-6"
            style={{ background: 'var(--bg)' }}
        >
            <h1 className="hidden lg:block" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--text)' }}>
                My things
            </h1>

            {/* Mobile segmented control (hidden at lg+) — incidents live inside the Devices pane now. */}
            <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5 lg:hidden"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}>
                <div className="tad-tabs tad-tabs--pill flex-1" role="tablist" aria-label="Views">
                    <button type="button" role="tab"
                        aria-selected={mobilePane === 'map'}
                        onClick={() => setMobilePane('map')}
                        className="tad-tab flex-1 justify-center">
                        Map
                    </button>
                    <Link href="/my/devices?view=list" role="tab"
                        aria-selected={mobilePane === 'list' && activeTab === 'assets'}
                        onClick={() => setMobilePane('list')}
                        className="tad-tab flex-1 justify-center" style={{ textDecoration: 'none' }}>
                        Devices
                        {devices.length > 0 && <span className="tad-tab__count">{devices.length}</span>}
                        {activeTab === 'assets' && newIncidentCount > 0 && <span className="tad-tab__count">{newIncidentCount}</span>}
                    </Link>
                    <Link href="/my/beats?view=list" role="tab"
                        aria-selected={mobilePane === 'list' && activeTab === 'beats'}
                        onClick={() => setMobilePane('list')}
                        className="tad-tab flex-1 justify-center" style={{ textDecoration: 'none' }}>
                        Beats
                        {beats.length > 0 && <span className="tad-tab__count">{beats.length}</span>}
                    </Link>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:grid lg:flex-none lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-4">

                {/* ── LEFT COLUMN: slim device list → pinned selected card → incidents ─────── */}
                {/* Plain wrapper carries the responsive show/hide (Tailwind utilities can't override
                    the unlayered .tad-card display, so the toggle lives on this div instead). */}
                <div className={`${mobilePane === 'list' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3 lg:flex lg:flex-none lg:overflow-visible lg:p-0`}>

                {/* Device / Beat list card */}
                <Card flushBody
                    className="tad-card--fill min-h-0 lg:flex-none">
                    <div className="hidden shrink-0 overflow-x-auto lg:block" style={{ padding: '12px 14px 0' }}>
                        {/* Pill tabs are real links — each view (Assets / Beats) is its own route.
                            On narrow screens the row scrolls horizontally instead of wrapping/overflowing. */}
                        <div className="tad-tabs tad-tabs--pill w-max min-w-full" role="tablist">
                            {TAB_LINKS.map(t => {
                                const count = t.value === 'assets' ? devices.length : t.value === 'beats' ? beats.length : null;
                                return (
                                    <Link key={t.value} href={t.href} role="tab"
                                        aria-selected={activeTab === t.value}
                                        className="tad-tab flex-1 justify-center" style={{ textDecoration: 'none' }}>
                                        {t.label}
                                        {count != null && <span className="tad-tab__count">{count}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slim list. On mobile the whole LEFT column scrolls (parent has overflow-y-auto),
                        so the list grows to its natural height; on desktop the list scrolls within a
                        capped height so the pinned card + incidents below stay reachable in the column. */}
                    <div className="mt-2.5 min-h-0 overflow-y-auto lg:max-h-[40vh]">

                        {/* ── ASSETS ──────────────────────────────────────── */}
                        {activeTab === 'assets' && (
                            devices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center" style={{ padding: 24, gap: 8 }}>
                                    <Smartphone className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No assets yet.</p>
                                </div>
                            ) : devices.map(device => {
                                const on = selectedDev === device.id;
                                // Slim row: small live-status dot + name + IMEI, tightened padding.
                                const dot = STATUS_PIN[getMyStatus(device)];
                                return (
                                    <div key={device.id} id={`device-${device.id}`}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px',
                                            borderLeft: `3px solid ${on ? 'var(--brand)' : 'transparent'}`,
                                            background: on ? 'var(--brand-subtle)' : 'transparent',
                                        }}>
                                        <button onClick={() => selectDevice(device.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flex: 'none', overflow: 'hidden', position: 'relative' }}>
                                                {device.image_url
                                                    ? <img src={device.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <Smartphone width={15} height={15} />}
                                                <span style={{ position: 'absolute', right: -1, bottom: -1, width: 9, height: 9, borderRadius: '50%', background: dot, border: '2px solid var(--surface)' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{device.name}</div>
                                                <div className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)' }}>{device.imei}</div>
                                            </div>
                                        </button>
                                        <button onClick={() => goToDevice(device.id)} aria-label="Details" title="Details"
                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-subtle)', padding: 4, flex: 'none' }}>
                                            <ChevronRight width={15} height={15} />
                                        </button>
                                    </div>
                                );
                            })
                        )}

                        {activeTab === 'assets' && (
                            <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
                                <button onClick={onRegisterClick} className="tad-btn tad-btn--subtle tad-btn--sm tad-btn--block">
                                    <Plus className="w-3.5 h-3.5" />
                                    Register device
                                </button>
                            </div>
                        )}

                        {/* ── BEATS ───────────────────────────────────────── */}
                        {activeTab === 'beats' && (
                            beats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center" style={{ padding: 24, gap: 8 }}>
                                    <MapPin className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No beats yet.</p>
                                </div>
                            ) : beats.map(beat => {
                                const on = selectedBeat === beat.id;
                                const assigned = devices.find(d => d.current_beat?.id === beat.id);
                                return (
                                    <div key={beat.id} id={`beat-${beat.id}`}
                                        style={{
                                            display: 'flex', alignItems: 'center',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            borderLeft: `3px solid ${on ? 'var(--brand)' : 'transparent'}`,
                                            background: on ? 'var(--brand-subtle)' : 'transparent',
                                        }}>
                                        <button onClick={() => focusBeat(beat.id)}
                                            style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer', padding: '13px 16px', background: 'transparent', border: 'none' }}>
                                            <div className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{beat.name}</div>
                                            <div className="truncate" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                                                {beat.status}{beat.coordinates?.length > 0 ? ` · ${beat.coordinates.length} pts` : ''}
                                            </div>
                                            {assigned && (
                                                <div className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{assigned.name}</div>
                                            )}
                                        </button>
                                        <a href={`/my/beats/${beat.id}`} aria-label={`Edit ${beat.name}`} title="Edit / delete beat"
                                            style={{ flex: 'none', padding: '0 14px', alignSelf: 'stretch', display: 'inline-flex', alignItems: 'center', color: 'var(--text-subtle)' }}>
                                            <Pencil width={15} height={15} />
                                        </a>
                                    </div>
                                );
                            })
                        )}

                        {activeTab === 'beats' && (
                            <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <a href="/my/beats/create" className="tad-btn tad-btn--subtle tad-btn--sm tad-btn--block">
                                    <Plus className="w-3.5 h-3.5" />
                                    Create beat
                                </a>
                                <button onClick={() => setShowImport(true)} className="tad-btn tad-btn--ghost tad-btn--sm tad-btn--block">
                                    <Upload className="w-3.5 h-3.5" />
                                    Import KML / KMZ
                                </button>
                            </div>
                        )}

                        {/* ── TRIPS — selected device's auto-detected trips ── */}
                        {activeTab === 'trips' && (
                            selectedDev == null ? (
                                <div className="flex flex-col items-center justify-center text-center" style={{ padding: 24, gap: 8 }}>
                                    <Route className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Select an asset to see its trips.</p>
                                </div>
                            ) : tripsLoading ? (
                                <div className="flex items-center justify-center" style={{ padding: 24 }}>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading…</p>
                                </div>
                            ) : trips.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center" style={{ padding: 24, gap: 8 }}>
                                    <Route className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No trips yet.</p>
                                </div>
                            ) : trips.map(trip => (
                                <div key={trip.id} style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                                        <span className="truncate" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                                            {formatTripCoords(trip.start)} → {formatTripCoords(trip.end)}
                                        </span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--brand)', flex: 'none' }}>{trip.distanceKm} km</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                        {formatTripWhen(trip.startedAt)} · {formatTripDuration(trip.durationS)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* ── Pinned selected-device card (sits ON TOP of the incidents) ───────────
                    Only on the Assets view; reuses the device-detail DeviceSummaryCard. */}
                {activeTab === 'assets' && selectedDevice && (
                    <DeviceSummaryCard
                        name={selectedDevice.name}
                        speed={null}
                        lastSeenAt={selectedDevice.last_seen_at}
                        online={selectedStatus === 'online'}
                        battery={selectedDevice.battery_percent}
                        statusLabel={selectedStatus ? STATUS_CHIP[selectedStatus].label : undefined}
                        statusColor={selectedStatus ? STATUS_CHIP[selectedStatus].color : undefined}
                        productTag={selectedDevice.device_type?.name ?? null}
                    />
                )}

                {/* ── Incidents & alerts (infinite scroll) ─────────────────────────────────
                    All devices' incidents by default; a selected device filters server-side. */}
                {activeTab === 'assets' && (
                    <Card title="Incidents & alerts"
                        action={newIncidentCount > 0 ? <Badge variant="danger">{newIncidentCount} new</Badge> : undefined}>
                        {(selectedDev || selectedBeat) && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span className="truncate" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                    Filtered by: {selectedDev
                                        ? devices.find(d => d.id === selectedDev)?.name
                                        : beats.find(b => b.id === selectedBeat)?.name}
                                </span>
                                <button onClick={() => { setSelectedDev(null); setSelectedBeat(null); }}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', flex: 'none', marginLeft: 8 }}>
                                    <X width={12} height={12} />
                                    Show all
                                </button>
                            </div>
                        )}
                        {visibleIncidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center" style={{ padding: 18, gap: 8 }}>
                                <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--success)' }} />
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                    {incidentLoading ? 'Loading…' : 'No incidents in the last 3 days.'}
                                </p>
                            </div>
                        ) : (
                            <div className="lg:max-h-[calc(100vh-30rem)] lg:overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {visibleIncidents.map(incident => (
                                    <div key={incident.id} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                                        <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: INCIDENT_STATUS_DOT[incident.status] ?? 'var(--text-muted)', flex: 'none' }}>
                                            <AlertTriangle width={15} height={15} />
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="capitalize" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>
                                                {incident.display_label ?? incident.event_type.replace(/_/g, ' ')}
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {new Date(incident.triggered_at).toLocaleString()}
                                            </div>
                                            {incident.device && (
                                                <div className="truncate" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 1 }}>{incident.device.name}</div>
                                            )}
                                            {renderLiveMetric(incident)}
                                        </div>
                                    </div>
                                ))}
                                {/* Infinite-scroll sentinel + loading hint */}
                                {incidentHasMore && (
                                    <div ref={incidentSentinelRef} style={{ padding: '6px 0', textAlign: 'center', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                        {incidentLoading ? 'Loading more…' : ' '}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}
                </div>

                {/* ── RIGHT COLUMN: Live Map + trail/trip playback ─────────────────────────── */}
                <div className={`${mobilePane === 'map' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col lg:flex lg:flex-none`}>
                <Card flushBody style={{ overflow: 'hidden' }}
                    className="tad-card--fill min-h-0 flex-1 lg:flex-none">
                    {/* Fills the pane on mobile; fixed 460px in the desktop split. */}
                    <div className="relative flex-1 min-h-[70vh] lg:min-h-0 lg:h-[460px] lg:flex-none">
                        {!MAPS_KEY ? (
                            <div className="h-full flex items-center justify-center p-8 text-center" style={{ background: 'var(--bg-sunken)' }}>
                                <div className="flex flex-col items-center gap-3">
                                    <MapPin className="w-9 h-9" style={{ color: 'var(--text-subtle)' }} />
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
                                    </p>
                                </div>
                            </div>
                        ) : <div ref={mapRef} className="absolute inset-0" />}

                        {/* Map toggles: Show trail + Beats */}
                        {mapsReady && (
                            <div className="absolute top-4 left-4" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <label
                                        title={selectedDev ? 'Show this device’s recent path' : 'Select a device to show its trail'}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: selectedDev ? 'pointer' : 'not-allowed',
                                            background: 'var(--surface)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-pill)', padding: '6px 12px',
                                            boxShadow: 'var(--shadow-sm)', fontSize: 'var(--text-xs)',
                                            fontWeight: 'var(--weight-medium)', color: selectedDev ? 'var(--text)' : 'var(--text-muted)',
                                        }}>
                                        <input type="checkbox" checked={showTrail} disabled={!selectedDev}
                                            onChange={(e) => setShowTrail(e.target.checked)}
                                            style={{ accentColor: 'var(--brand)', width: 14, height: 14, cursor: selectedDev ? 'pointer' : 'not-allowed' }} />
                                        Show trail
                                    </label>
                                    <label
                                        title="Show / hide beat zones"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                                            background: 'var(--surface)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-pill)', padding: '6px 12px',
                                            boxShadow: 'var(--shadow-sm)', fontSize: 'var(--text-xs)',
                                            fontWeight: 'var(--weight-medium)', color: 'var(--text)',
                                        }}>
                                        <input type="checkbox" checked={showBeats}
                                            onChange={(e) => setShowBeats(e.target.checked)}
                                            style={{ accentColor: 'var(--brand)', width: 14, height: 14, cursor: 'pointer' }} />
                                        Beats
                                    </label>
                                </div>
                                {showTrail && selectedDev && trailEmpty && (
                                    <span style={{
                                        background: 'var(--surface)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-pill)', padding: '5px 11px',
                                        boxShadow: 'var(--shadow-sm)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)',
                                    }}>
                                        No recent trail for this device yet.
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Floating selected-device card */}
                        {mapsReady && selectedDevice && (
                            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="truncate" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{selectedDevice.name}</div>
                                    <div className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)' }}>
                                        {selectedDevice.last_lat != null && selectedDevice.last_lon != null
                                            ? `${Number(selectedDevice.last_lat).toFixed(4)}, ${Number(selectedDevice.last_lon).toFixed(4)}`
                                            : 'No location yet'}
                                    </div>
                                </div>
                                {selectedDevice.battery_percent != null && (
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)', flex: 'none' }}>
                                        {selectedDevice.battery_percent}%
                                    </span>
                                )}
                                <Button size="sm" variant="secondary" onClick={() => goToDevice(selectedDevice.id)}>Details</Button>
                            </div>
                        )}

                        {/* Live / connecting badge */}
                        {mapsReady && (
                            <div className="absolute bottom-4 left-4" style={{ zIndex: 1 }}>
                                <div className="flex items-center gap-1.5 px-2.5 py-1"
                                    style={{
                                        fontSize: 'var(--text-xs)',
                                        fontWeight: 'var(--weight-medium)',
                                        borderRadius: 'var(--radius-pill)',
                                        boxShadow: 'var(--shadow-sm)',
                                        background: realtimeConnected ? 'var(--success-bg)' : 'var(--surface)',
                                        border: `1px solid ${realtimeConnected ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'var(--border)'}`,
                                        color: realtimeConnected ? 'var(--success)' : 'var(--text-muted)',
                                    }}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'animate-pulse' : ''}`}
                                        style={{ background: realtimeConnected ? 'var(--success)' : 'var(--text-muted)' }} />
                                    {realtimeConnected ? 'Live' : 'Connecting…'}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
                </div>
            </div>

            {showImport && (
                <ImportBeatsModal
                    token={token}
                    onClose={() => setShowImport(false)}
                    onImported={() => { setShowImport(false); loadBeats(); }}
                />
            )}

        </div>
    );
}
