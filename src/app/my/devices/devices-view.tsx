'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Bell, BellOff, Plus, Camera, Smartphone, MapPin, BatteryLow, Battery, Upload, CheckCircle2, Route } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident, Beat, NotificationPreference } from '@/lib/api-client';
import { Badge } from '@/components/ui';
import ImportBeatsModal from '../beats/import-beats-modal';
import {
    arrowRotation,
    useArrow,
} from '@/lib/map-markers';

interface Props {
    devices:            Device[];
    incidents:          Incident[];
    initialBeats:       Beat[];
    token:              string;
    realtimeConnected?: boolean;
    onRegisterClick:    () => void;
}

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

const BEAT_STATUS_DOT: Record<string, string> = {
    active: 'var(--success)', inactive: 'var(--text-muted)', draft: 'var(--warning)',
};

type MyStatus = 'online' | 'offline' | 'unavailable';

function getMyStatus(device: Device): MyStatus {
    if (!device.last_seen_at) return 'unavailable';
    const mins = (Date.now() - new Date(device.last_seen_at).getTime()) / 60_000;
    if (mins <= 30)   return 'online';
    if (mins <= 1440) return 'offline';
    return 'unavailable';
}

const STATUS_DOT: Record<MyStatus, string> = {
    online: 'var(--success)', offline: 'var(--danger)', unavailable: 'var(--text-muted)',
};
const STATUS_TEXT: Record<MyStatus, string> = {
    online: 'var(--success)', offline: 'var(--danger)', unavailable: 'var(--text-muted)',
};
const STATUS_LABEL: Record<MyStatus, string> = {
    online: 'Online', offline: 'Offline', unavailable: 'Unavailable',
};

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
    // @ts-expect-error heading not yet in Device type — will be null
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
}: Props) {
    const [devices,         setDevices]         = useState<Device[]>(incomingDevices);
    const [beats,           setBeats]           = useState<Beat[]>(initialBeats);
    const [activeTab,       setActiveTab]       = useState<'devices' | 'beats'>('devices');
    const [selectedDev,     setSelectedDev]     = useState<number | null>(null);
    const [selectedBeat,    setSelectedBeat]    = useState<number | null>(null);
    const [mapsReady,       setMapsReady]       = useState(false);
    const [showImport,      setShowImport]      = useState(false);

    // Right panel: Incidents | Trips
    const [rightTab,        setRightTab]        = useState<'incidents' | 'trips'>('incidents');
    const [trips,           setTrips]           = useState<Trip[]>([]);
    const [tripsLoading,    setTripsLoading]    = useState(false);

    // Device drawer state
    const [drawerOpen,      setDrawerOpen]      = useState(false);
    const [drawerDevice,    setDrawerDevice]    = useState<Device | null>(null);
    const [editName,        setEditName]        = useState('');
    const [editNotes,       setEditNotes]       = useState('');
    const [editTab,         setEditTab]         = useState<'info' | 'notif'>('info');
    const [saving,          setSaving]          = useState(false);
    const [uploadingImage,  setUploadingImage]  = useState(false);
    const [beatAssigning,   setBeatAssigning]   = useState(false);
    const [unlinkConfirm,   setUnlinkConfirm]   = useState(false);
    const [unlinking,       setUnlinking]       = useState(false);
    const [drawerError,     setDrawerError]     = useState<string | null>(null);
    const [notifPrefs,      setNotifPrefs]      = useState<NotificationPreference[]>([]);
    const [notifLoading,    setNotifLoading]    = useState(false);
    const [notifSaving,     setNotifSaving]     = useState(false);

    const mapRef      = useRef<HTMLDivElement>(null);
    const gmapRef     = useRef<google.maps.Map | null>(null);
    const markersRef  = useRef<Map<number, { setMap: (m: google.maps.Map | null) => void; position?: { lat: number; lng: number } }>>(new Map());
    const markerSigRef = useRef<Map<number, string>>(new Map());
    const polysRef    = useRef<Map<number, google.maps.Polygon>>(new Map());
    const trailRef    = useRef<google.maps.Polyline | null>(null);
    const [showTrail, setShowTrail] = useState(false);
    const beatsRef    = useRef<Beat[]>(initialBeats);

    // ── Filtered incidents ────────────────────────────────────────────────────
    const visibleIncidents = incidents.filter(i => {
        if (selectedDev)  return i.device?.id === selectedDev;
        if (selectedBeat) return i.beat?.id   === selectedBeat;
        return true;
    });

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
            marker.addListener?.('click', () => openDevice(device.id, map));
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
                marker.addListener?.('click', () => openDevice(device.id));
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

        if (!showTrail || !selectedDev) { clear(); return; }

        let cancelled = false;
        (async () => {
            try {
                const res = await new ApiClient(token).deviceTrail(selectedDev, 24);
                if (cancelled) return;
                const path = res.points
                    .filter(p => p.lat != null && p.lng != null)
                    .map(p => ({ lat: p.lat, lng: p.lng }));
                clear();
                if (path.length < 2) return;
                trailRef.current = new google.maps.Polyline({
                    path, map, geodesic: true,
                    strokeColor: '#01411C', strokeOpacity: 0.85, strokeWeight: 3,
                });
            } catch { /* trail unavailable — leave the map as-is */ }
        })();

        return () => { cancelled = true; };
    }, [showTrail, selectedDev, devices, mapsReady, token]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // ── Open device detail drawer ─────────────────────────────────────────────
    const openDevice = useCallback((id: number, map?: google.maps.Map) => {
        const m      = map ?? gmapRef.current;
        const device = devices.find(d => d.id === id);
        if (!device) return;

        // Pan map to device
        if (m) {
            const lat = Number(device.last_lat);
            const lng = Number(device.last_lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                m.panTo({ lat, lng });
                if ((m.getZoom() ?? 10) < 13) setTimeout(() => m.setZoom(15), 250);
            }
        }

        setSelectedDev(id);
        setSelectedBeat(null);
        setDrawerDevice(device);
        setEditName(device.name);
        setEditNotes(device.notes ?? '');
        setDrawerOpen(true);
        setDrawerError(null);
        setEditTab('info');
        setUnlinkConfirm(false);
        document.getElementById(`device-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [devices]);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setDrawerDevice(null);
        setSelectedDev(null);
    }, []);

    // ── Load notification prefs when switching to notif tab ───────────────────
    useEffect(() => {
        if (editTab !== 'notif' || !drawerDevice) return;
        if (notifPrefs.length > 0) return; // already loaded for this device
        setNotifLoading(true);
        const api = new ApiClient(token);
        api.getNotificationPreferences(drawerDevice.id)
            .then(res => setNotifPrefs(res.data))
            .catch(() => {})
            .finally(() => setNotifLoading(false));
    }, [editTab, drawerDevice]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset prefs when device changes
    useEffect(() => { setNotifPrefs([]); }, [drawerDevice?.id]);

    // ── Save device name + notes ──────────────────────────────────────────────
    async function saveDevice() {
        if (!drawerDevice) return;
        setSaving(true);
        setDrawerError(null);
        try {
            const api     = new ApiClient(token);
            const updated = await api.updateDevice(drawerDevice.id, {
                name:  editName.trim() || drawerDevice.name,
                notes: editNotes.trim() || null,
            });
            setDevices(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
            setDrawerDevice(prev => prev ? { ...prev, ...updated } : prev);
            markersRef.current.get(updated.id)?.setMap?.(null);
        } catch {
            setDrawerError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    // ── Upload device image ───────────────────────────────────────────────────
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !drawerDevice) return;
        setUploadingImage(true);
        setDrawerError(null);
        try {
            const api  = new ApiClient(token);
            const res  = await api.uploadDeviceImage(drawerDevice.id, file);
            const url  = res.image_url;
            setDevices(prev => prev.map(d => d.id === drawerDevice.id ? { ...d, image_url: url } : d));
            setDrawerDevice(prev => prev ? { ...prev, image_url: url } : prev);
        } catch {
            setDrawerError('Image upload failed.');
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    }

    // ── Save notification preferences ─────────────────────────────────────────
    async function saveNotifPrefs() {
        if (!drawerDevice) return;
        setNotifSaving(true);
        try {
            const api = new ApiClient(token);
            await api.updateNotificationPreferences(
                drawerDevice.id,
                notifPrefs.map(p => ({ event_type: p.event_type, sms_enabled: p.sms_enabled })),
            );
        } catch {
            setDrawerError('Failed to save notification preferences.');
        } finally {
            setNotifSaving(false);
        }
    }

    function toggleNotif(eventType: string) {
        setNotifPrefs(prev => prev.map(p =>
            p.event_type === eventType ? { ...p, sms_enabled: !p.sms_enabled } : p,
        ));
    }

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

        // Add polygons for newly added beats
        const newBeats = beats.filter(b => !polysRef.current.has(b.id) && (b.coordinates?.length ?? 0) > 0);
        newBeats.forEach(beat => {
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
        });

        // Pan to newly added beats
        if (newBeats.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            newBeats.forEach(beat => beat.coordinates.forEach(v => bounds.extend(v)));
            map.fitBounds(bounds, 80);
        }
    }, [beats, mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Beat operations ───────────────────────────────────────────────────────
    async function assignBeat(deviceId: number, beatId: number) {
        setBeatAssigning(true);
        try {
            const api   = new ApiClient(token);
            const { beat } = await api.assignBeat(deviceId, beatId);
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, current_beat: beat } : d));
            setDrawerDevice(prev => prev?.id === deviceId ? { ...prev, current_beat: beat } : prev);
        } finally { setBeatAssigning(false); }
    }

    async function unassignBeat(deviceId: number) {
        setBeatAssigning(true);
        try {
            await new ApiClient(token).unassignBeat(deviceId);
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, current_beat: null } : d));
            setDrawerDevice(prev => prev?.id === deviceId ? { ...prev, current_beat: null } : prev);
        } finally { setBeatAssigning(false); }
    }

    // ── Unlink device ─────────────────────────────────────────────────────────
    async function unlinkDevice() {
        if (!drawerDevice) return;
        setUnlinking(true);
        setDrawerError(null);
        try {
            await new ApiClient(token).unlinkDevice(drawerDevice.id);
            setDevices(prev => prev.filter(d => d.id !== drawerDevice.id));
            markersRef.current.get(drawerDevice.id)?.setMap?.(null);
            markersRef.current.delete(drawerDevice.id);
            closeDrawer();
        } catch {
            setDrawerError('Failed to unlink device. Please try again.');
        } finally {
            setUnlinking(false);
            setUnlinkConfirm(false);
        }
    }

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
        setDrawerOpen(false);
        document.getElementById(`beat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    return (
        <div className="mx-auto flex w-full max-w-[1600px] h-[calc(100vh-4rem)] overflow-hidden"
            style={{ background: 'var(--bg)' }}>

            {/* ── LEFT: Devices / Beats tabs ──────────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col"
                style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>

                {/* Tab bar */}
                <div className="shrink-0 flex" style={{ borderBottom: '1px solid var(--border)' }}>
                    {(['devices', 'beats'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="flex-1 py-2.5 transition-colors"
                            style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: activeTab === tab ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                                color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
                                borderBottom: `2px solid ${activeTab === tab ? 'var(--brand)' : 'transparent'}`,
                            }}>
                            {tab === 'devices' ? `Devices (${devices.length})` : `Beats (${beats.length})`}
                        </button>
                    ))}
                </div>

                {/* Devices list */}
                <div className={`flex-1 overflow-y-auto flex flex-col ${activeTab !== 'devices' ? 'hidden' : ''}`}
                    style={{ gap: 8, padding: devices.length === 0 ? 0 : 10 }}>
                    {devices.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                            <Smartphone className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No devices yet.</p>
                        </div>
                    ) : devices.map(device => {
                        const st    = getMyStatus(device);
                        const isSel = selectedDev === device.id;
                        const activeIncCount = incidents.filter(i =>
                            i.device?.id === device.id && ['open','acknowledged','escalated'].includes(i.status)
                        ).length;

                        return (
                            <button key={device.id} id={`device-${device.id}`}
                                onClick={() => openDevice(device.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%',
                                    textAlign: 'left', cursor: 'pointer', borderRadius: 'var(--radius-lg)',
                                    border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                                    background: isSel ? 'var(--brand-subtle)' : 'var(--surface)',
                                    transition: 'border-color .15s, background .15s',
                                }}>
                                {/* Icon tile (device image or fallback) */}
                                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
                                    {device.image_url
                                        ? <img src={device.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <Smartphone width={20} height={20} />}
                                </div>
                                {/* Name + identity */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="truncate" style={{ fontSize: 15, fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>{device.name}</div>
                                    <div className="truncate" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{device.imei}</div>
                                </div>
                                {/* Status + secondary metric */}
                                <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        {activeIncCount > 0 && (
                                            <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {activeIncCount > 9 ? '9+' : activeIncCount}
                                            </span>
                                        )}
                                        <span title={STATUS_LABEL[st]} style={{ width: 9, height: 9, borderRadius: 999, flex: 'none', background: STATUS_DOT[st], boxShadow: st === 'online' ? `0 0 0 3px color-mix(in srgb, ${STATUS_DOT[st]} 22%, transparent)` : 'none' }} />
                                    </span>
                                    {device.battery_percent != null
                                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 12, color: device.battery_percent < 20 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                            {device.battery_percent < 20 ? <BatteryLow width={13} height={13} /> : <Battery width={13} height={13} />}
                                            {device.battery_percent}%
                                          </span>
                                        : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{STATUS_LABEL[st]}</span>}
                                </div>
                            </button>
                        );
                    })}

                    {/* Register device button at bottom */}
                    <div className="mt-auto p-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <button onClick={onRegisterClick}
                            className="tad-btn tad-btn--subtle tad-btn--sm tad-btn--block">
                            <Plus className="w-3.5 h-3.5" />
                            Register device
                        </button>
                    </div>
                </div>

                {/* Beats list */}
                <div className={`flex-1 overflow-y-auto flex flex-col ${activeTab !== 'beats' ? 'hidden' : ''}`}>
                    {beats.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                            <MapPin className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No beats yet.</p>
                        </div>
                    ) : beats.map(beat => (
                        <button key={beat.id} id={`beat-${beat.id}`}
                            onClick={() => focusBeat(beat.id)}
                            className="w-full text-left px-3 py-2.5 transition-colors"
                            style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                borderLeft: `2px solid ${selectedBeat === beat.id ? 'var(--brand)' : 'transparent'}`,
                                background: selectedBeat === beat.id ? 'var(--brand-subtle)' : 'transparent',
                            }}>
                            <div className="flex items-center gap-2.5">
                                <span className="shrink-0 w-3 h-3 rounded-sm mt-0.5" style={{ background: beat.color ?? 'var(--brand)' }} />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate leading-tight" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>{beat.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: BEAT_STATUS_DOT[beat.status] ?? 'var(--text-muted)' }} />
                                        <span className="capitalize" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{beat.status}</span>
                                        {beat.coordinates?.length > 0 && (
                                            <span className="ml-auto" style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{beat.coordinates.length} pts</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}

                    <div className="mt-auto p-3 shrink-0 space-y-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <a href="/my/beats/create"
                            className="tad-btn tad-btn--subtle tad-btn--sm tad-btn--block">
                            <Plus className="w-3.5 h-3.5" />
                            Create beat
                        </a>
                        <button onClick={() => setShowImport(true)}
                            className="tad-btn tad-btn--ghost tad-btn--sm tad-btn--block">
                            <Upload className="w-3.5 h-3.5" />
                            Import KML / KMZ
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CENTER: Live Map ─────────────────────────────────────────── */}
            <div className="flex-1 relative min-w-0">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center p-8 text-center"
                        style={{ background: 'var(--bg-sunken)' }}>
                        <div className="flex flex-col items-center gap-3">
                            <MapPin className="w-9 h-9" style={{ color: 'var(--text-subtle)' }} />
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
                            </p>
                        </div>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}

                {/* Show-trail toggle — draws the selected device's recent path */}
                {mapsReady && (
                    <label className="absolute top-4 left-4"
                        title={selectedDev ? 'Show this device’s recent path' : 'Select a device to show its trail'}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
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
                )}

                {/* Live / connecting badge */}
                {mapsReady && (
                    <div className="absolute bottom-4 left-4">
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

            {/* ── RIGHT: Incidents | Trips ─────────────────────────────────── */}
            <div className="w-72 shrink-0 flex flex-col"
                style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>

                {/* Tab bar (mirrors the left-sidebar pattern) */}
                <div className="shrink-0 flex" style={{ borderBottom: '1px solid var(--border)' }}>
                    {(['incidents', 'trips'] as const).map(tab => (
                        <button key={tab} onClick={() => setRightTab(tab)}
                            className="flex-1 py-2.5 transition-colors"
                            style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: rightTab === tab ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                                color: rightTab === tab ? 'var(--text)' : 'var(--text-muted)',
                                borderBottom: `2px solid ${rightTab === tab ? 'var(--brand)' : 'transparent'}`,
                            }}>
                            {tab === 'incidents'
                                ? `Incidents${visibleIncidents.length > 0 ? ` (${visibleIncidents.length})` : ''}`
                                : `Trips${selectedDev && trips.length > 0 ? ` (${trips.length})` : ''}`}
                        </button>
                    ))}
                </div>

                {/* ── INCIDENTS ──────────────────────────────────────────── */}
                <div className={`flex-1 flex flex-col min-h-0 ${rightTab !== 'incidents' ? 'hidden' : ''}`}>
                    {(selectedDev || selectedBeat) && (
                        <div className="shrink-0 px-4 py-2 flex items-center justify-between"
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <p className="truncate" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                Filtered by: {selectedDev
                                    ? devices.find(d => d.id === selectedDev)?.name
                                    : beats.find(b => b.id === selectedBeat)?.name}
                            </p>
                            <button
                                onClick={() => { setSelectedDev(null); setSelectedBeat(null); }}
                                className="shrink-0 ml-2"
                                style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', color: 'var(--brand)' }}>
                                Show all
                            </button>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        {visibleIncidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
                                <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--success)' }} />
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No incidents in the last 3 days.</p>
                            </div>
                        ) : visibleIncidents.map(incident => (
                            <div key={incident.id}
                                className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: INCIDENT_STATUS_DOT[incident.status] ?? 'var(--text-muted)' }} />
                                    <span className="capitalize px-1.5 py-0.5 rounded-full"
                                        style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...(PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low) }}>
                                        {incident.priority}
                                    </span>
                                    <span className="ml-auto capitalize" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{incident.status}</span>
                                </div>
                                <p className="capitalize" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>
                                    {incident.event_type.replace(/_/g, ' ')}
                                </p>
                                {incident.device && (
                                    <p className="mt-0.5 truncate" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{incident.device.name}</p>
                                )}
                                {incident.beat && (
                                    <p className="truncate" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>Beat: {incident.beat.name}</p>
                                )}
                                <p className="mt-1" style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                                    {new Date(incident.triggered_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── TRIPS — selected device's auto-detected trips ──────── */}
                <div className={`flex-1 flex flex-col min-h-0 ${rightTab !== 'trips' ? 'hidden' : ''}`}>
                    {selectedDev && (
                        <div className="shrink-0 px-4 py-2 truncate"
                            style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                            {devices.find(d => d.id === selectedDev)?.name}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto"
                        style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: selectedDev && trips.length > 0 ? 14 : 0 }}>
                        {selectedDev == null ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                                <Route className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Select a device to see its trips.</p>
                            </div>
                        ) : tripsLoading ? (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading…</p>
                            </div>
                        ) : trips.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                                <Route className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No trips yet.</p>
                            </div>
                        ) : trips.map(trip => (
                            <div key={trip.id}
                                style={{ padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                {/* Top row: timestamp + distance badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                                        {formatTripWhen(trip.startedAt)}
                                    </span>
                                    <span style={{ marginLeft: 'auto' }}>
                                        <Badge variant="brand" mono>{trip.distanceKm} km</Badge>
                                    </span>
                                </div>
                                {/* Body: timeline column + start/end + duration */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                        <span style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid var(--status-idle)' }} />
                                        <span style={{ width: 2, height: 20, background: 'var(--border-strong)' }} />
                                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--brand)' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>
                                        <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                                            Start <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatTripCoords(trip.start)}</span>
                                        </div>
                                        <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                                            End <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatTripCoords(trip.end)}</span>
                                        </div>
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', flex: 'none' }}>
                                        {formatTripDuration(trip.durationS)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showImport && (
                <ImportBeatsModal
                    token={token}
                    onClose={() => setShowImport(false)}
                    onImported={() => { setShowImport(false); loadBeats(); }}
                />
            )}

            {/* ── Device detail drawer (slides over the right incidents panel) */}
            {drawerOpen && (
                <div className="fixed inset-0 z-40" onClick={closeDrawer} />
            )}
            <div className={`fixed top-16 right-0 bottom-0 z-50 w-80 flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xl)', borderLeft: '1px solid var(--border)' }}>
                {drawerDevice && (
                    <>
                        {/* Drawer header */}
                        <div className="shrink-0 px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {/* Device photo */}
                            <label className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
                                style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                                {drawerDevice.image_url
                                    ? <img src={drawerDevice.image_url} alt="" className="w-full h-full object-cover" />
                                    : (drawerDevice.map_icon
                                        ? <span className="text-2xl">{drawerDevice.map_icon}</span>
                                        : <Smartphone className="w-5 h-5" />)}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                                    {uploadingImage
                                        ? <span className="text-white" style={{ fontSize: 'var(--text-2xs)' }}>…</span>
                                        : <Camera className="w-4 h-4 text-white" />}
                                </div>
                                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                            <div className="flex-1 min-w-0">
                                <p className="truncate leading-tight" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>{drawerDevice.name}</p>
                                <p className="truncate" style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{drawerDevice.imei}</p>
                            </div>
                            <button onClick={closeDrawer} className="tad-iconbtn tad-iconbtn--sm shrink-0" aria-label="Close">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer sub-tabs */}
                        <div className="shrink-0 flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {(['info', 'notif'] as const).map(t => (
                                <button key={t} onClick={() => setEditTab(t)}
                                    className="flex-1 py-2 transition-colors"
                                    style={{
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: editTab === t ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                                        color: editTab === t ? 'var(--text)' : 'var(--text-muted)',
                                        borderBottom: `2px solid ${editTab === t ? 'var(--brand)' : 'transparent'}`,
                                    }}>
                                    {t === 'info' ? 'Info & edit' : 'Notifications'}
                                </button>
                            ))}
                        </div>

                        {drawerError && (
                            <div className="mx-4 mt-3 rounded-lg px-3 py-2"
                                style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                {drawerError}
                            </div>
                        )}

                        {/* Drawer body */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                            {editTab === 'info' && (
                                <>
                                    {/* Name */}
                                    <div>
                                        <label className="block uppercase mb-1" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Device name</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveDevice(); }}
                                                className="tad-input flex-1"
                                                style={{ height: 34, fontSize: 'var(--text-sm)' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block uppercase mb-1" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Assignee / notes</label>
                                        <textarea
                                            value={editNotes}
                                            onChange={e => setEditNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Add notes about this device or its assignee…"
                                            className="tad-input w-full resize-none"
                                            style={{ height: 'auto', padding: '8px 12px', fontSize: 'var(--text-sm)' }}
                                        />
                                    </div>

                                    <button onClick={saveDevice} disabled={saving}
                                        className="tad-btn tad-btn--primary tad-btn--sm tad-btn--block">
                                        {saving ? 'Saving…' : 'Save changes'}
                                    </button>

                                    {/* Beat assignment */}
                                    <div>
                                        <p className="uppercase mb-2" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Beat (geofence)</p>
                                        {drawerDevice.current_beat ? (
                                            <div className="flex items-center gap-2 mb-2 rounded-lg px-3 py-2" style={{ border: '1px solid var(--border)' }}>
                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: drawerDevice.current_beat.color }} />
                                                <span className="flex-1 truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{drawerDevice.current_beat.name}</span>
                                                <button onClick={() => unassignBeat(drawerDevice.id)} disabled={beatAssigning}
                                                    style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)', opacity: beatAssigning ? 0.4 : 1 }}>
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Not assigned to any beat.</p>
                                        )}
                                        {beats.length > 0 && (
                                            <select
                                                value={drawerDevice.current_beat?.id ?? ''}
                                                onChange={e => { const id = Number(e.target.value); if (id) assignBeat(drawerDevice.id, id); }}
                                                disabled={beatAssigning}
                                                className="tad-select tad-select--sm w-full">
                                                <option value="">{beatAssigning ? 'Saving…' : '— Assign beat —'}</option>
                                                {beats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        )}
                                    </div>

                                    {/* Status + location */}
                                    <div className="rounded-xl px-3 py-2.5 space-y-1.5" style={{ background: 'var(--surface-sunken)' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[getMyStatus(drawerDevice)] }} />
                                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: STATUS_TEXT[getMyStatus(drawerDevice)] }}>{STATUS_LABEL[getMyStatus(drawerDevice)]}</span>
                                            {drawerDevice.battery_percent != null && (
                                                <span className="ml-auto inline-flex items-center gap-1"
                                                    style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: drawerDevice.battery_percent < 20 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                                    {drawerDevice.battery_percent < 20
                                                        ? <BatteryLow className="w-3.5 h-3.5" />
                                                        : <Battery className="w-3.5 h-3.5" />}
                                                    {drawerDevice.battery_percent}%
                                                </span>
                                            )}
                                        </div>
                                        {drawerDevice.last_seen_at && (
                                            <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                                Last seen {new Date(drawerDevice.last_seen_at).toLocaleString()}
                                            </p>
                                        )}
                                        {drawerDevice.last_lat != null && (
                                            <p style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                                {Number(drawerDevice.last_lat).toFixed(6)}, {Number(drawerDevice.last_lon).toFixed(6)}
                                            </p>
                                        )}
                                    </div>

                                    {drawerDevice.device_type && (
                                        <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-sunken)' }}>
                                            <p className="uppercase mb-0.5" style={{ fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>Device type</p>
                                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{drawerDevice.device_type.name}</p>
                                        </div>
                                    )}

                                    {/* Unlink device */}
                                    <div className="pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                        {unlinkConfirm ? (
                                            <div className="rounded-xl px-3 py-3 space-y-2"
                                                style={{ background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)' }}>Remove this device from your account?</p>
                                                <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--danger)' }}>You can re-register it later using the device ID.</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setUnlinkConfirm(false)}
                                                        className="tad-btn tad-btn--secondary tad-btn--sm flex-1">
                                                        Cancel
                                                    </button>
                                                    <button onClick={unlinkDevice} disabled={unlinking}
                                                        className="tad-btn tad-btn--danger tad-btn--sm flex-1">
                                                        {unlinking ? 'Removing…' : 'Yes, remove'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setUnlinkConfirm(true)}
                                                className="w-full py-1.5 rounded-pill transition-colors"
                                                style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)', borderRadius: 'var(--radius-pill)' }}>
                                                Unlink device
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {editTab === 'notif' && (
                                <>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        Toggle SMS alerts per incident type. Turning one off silences it for 24 hours.
                                    </p>
                                    {notifLoading ? (
                                        <div className="py-4 text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading…</div>
                                    ) : (
                                        <>
                                            <div className="space-y-1">
                                                {notifPrefs.map(pref => {
                                                    const isDisabledUntil = pref.sms_disabled_until && new Date(pref.sms_disabled_until) > new Date();
                                                    return (
                                                        <button key={pref.event_type}
                                                            onClick={() => toggleNotif(pref.event_type)}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
                                                            style={{
                                                                border: '1px solid var(--border)',
                                                                background: pref.sms_enabled ? 'var(--surface)' : 'var(--surface-sunken)',
                                                                opacity: pref.sms_enabled ? 1 : 0.6,
                                                            }}>
                                                            {pref.sms_enabled
                                                                ? <Bell className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
                                                                : <BellOff className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />}
                                                            <span className="flex-1" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{pref.label}</span>
                                                            {isDisabledUntil && (
                                                                <span className="shrink-0" style={{ fontSize: '9px', color: 'var(--warning)' }}>24h off</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button onClick={saveNotifPrefs} disabled={notifSaving}
                                                className="tad-btn tad-btn--primary tad-btn--sm tad-btn--block mt-2">
                                                {notifSaving ? 'Saving…' : 'Save preferences'}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
