'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Pencil, Check, Bell, BellOff, Plus, Camera } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident, Beat, NotificationPreference } from '@/lib/api-client';
import ImportBeatsModal from '../beats/import-beats-modal';
import {
    devicePinColor,
    deviceArrowUrl,
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

const PRIORITY_BADGE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-yellow-100 text-yellow-700',
    low:      'bg-gray-100 text-gray-600',
};

const INCIDENT_STATUS_DOT: Record<string, string> = {
    open:         'bg-red-500',
    acknowledged: 'bg-orange-400',
    escalated:    'bg-purple-500',
    resolved:     'bg-green-500',
    closed:       'bg-gray-400',
};

const BEAT_STATUS_DOT: Record<string, string> = {
    active: 'bg-green-500', inactive: 'bg-gray-400', draft: 'bg-yellow-400',
};

type MyStatus = 'online' | 'offline' | 'unavailable';

function getMyStatus(device: Device): MyStatus {
    if (!device.last_signal_at) return 'unavailable';
    const mins = (Date.now() - new Date(device.last_signal_at).getTime()) / 60_000;
    if (mins <= 30)   return 'online';
    if (mins <= 1440) return 'offline';
    return 'unavailable';
}

const STATUS_DOT: Record<MyStatus, string> = {
    online: 'bg-green-500', offline: 'bg-red-500', unavailable: 'bg-gray-400',
};
const STATUS_LABEL: Record<MyStatus, string> = {
    online: 'Online', offline: 'Offline', unavailable: 'Unavailable',
};

// Build a DOM element for the custom marker using the package's helpers
function makeMarkerElement(device: Device): HTMLElement {
    const signal = device.battery_percent;  // proxy until we have network signal field
    // @ts-expect-error heading not yet in Device type — will be null
    const heading: number | null = (device as { heading?: number }).heading ?? null;

    if (useArrow(heading)) {
        const img        = document.createElement('img');
        img.src          = deviceArrowUrl(signal);
        img.width        = ARROW_SIZE;
        img.height       = ARROW_SIZE;
        img.title        = device.name;
        img.style.display        = 'block';
        img.style.transformOrigin = 'center center';
        img.style.transform      = arrowRotation(heading);
        img.style.filter         = 'drop-shadow(0 1px 2px rgba(0,0,0,.4))';
        return img;
    }

    const div   = document.createElement('div');
    const color = devicePinColor(signal);
    div.title   = device.name;
    div.style.cssText = [
        `width:${PIN_SIZE}px`,
        `height:${PIN_SIZE}px`,
        `border-radius:50%`,
        `background:${color}`,
        `border:2.5px solid #fff`,
        `box-shadow:0 1px 4px rgba(0,0,0,.35)`,
        `cursor:pointer`,
    ].join(';');
    return div;
}

function makeSelectedMarkerElement(device: Device): HTMLElement {
    const el    = makeMarkerElement(device);
    const color = devicePinColor(device.battery_percent);
    // @ts-expect-error heading proxy
    const heading: number | null = (device as { heading?: number }).heading ?? null;

    if (!useArrow(heading)) {
        el.style.width       = `${PIN_SIZE + 8}px`;
        el.style.height      = `${PIN_SIZE + 8}px`;
        el.style.border      = `3px solid #fff`;
        el.style.boxShadow   = `0 0 0 2px ${color}, 0 2px 8px rgba(0,0,0,.4)`;
    }
    return el;
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
    const polysRef    = useRef<Map<number, google.maps.Polygon>>(new Map());
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
                fillColor:    beat.color ?? '#2563eb',
                fillOpacity:  0.15,
                strokeColor:  beat.color ?? '#2563eb',
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

            if (existing) {
                // Re-create content element to reflect updated signal/heading
                if ('content' in existing) {
                    (existing as { content: HTMLElement }).content = isSelected
                        ? makeSelectedMarkerElement(device)
                        : makeMarkerElement(device);
                }
                if (!isNaN(lat) && !isNaN(lng) && 'position' in existing) {
                    (existing as { position: { lat: number; lng: number } }).position = { lat, lng };
                }
            } else if (!isNaN(lat) && !isNaN(lng)) {
                const marker = createAdvancedMarker(map, device, isSelected);
                marker.addListener?.('click', () => openDevice(device.id));
                markersRef.current.set(device.id, marker);
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
        const color = devicePinColor(device.battery_percent);
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
                fillColor:    beat.color ?? '#2563eb',
                fillOpacity:  0.15,
                strokeColor:  beat.color ?? '#2563eb',
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
            p.setOptions({ fillOpacity: 0.15, strokeWeight: 2, strokeColor: b?.color ?? '#2563eb', fillColor: b?.color ?? '#2563eb', zIndex: 1 });
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
        <div className="mx-auto flex w-full max-w-[1600px] h-[calc(100vh-4rem)] overflow-hidden">

            {/* ── LEFT: Devices / Beats tabs ──────────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

                {/* Tab bar */}
                <div className="shrink-0 flex border-b border-gray-200 dark:border-gray-800">
                    {(['devices', 'beats'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2
                                ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                            {tab === 'devices' ? `Devices (${devices.length})` : `Beats (${beats.length})`}
                        </button>
                    ))}
                </div>

                {/* Devices list */}
                <div className={`flex-1 overflow-y-auto flex flex-col ${activeTab !== 'devices' ? 'hidden' : ''}`}>
                    {devices.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <p className="text-2xl mb-2">📡</p>
                            <p className="text-xs text-gray-400 mb-3">No devices yet.</p>
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
                                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 transition-all border-l-2
                                    ${isSel
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
                                        : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <div className="flex items-center gap-2">
                                    {/* Device image or icon */}
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center text-lg">
                                        {device.image_url
                                            ? <img src={device.image_url} alt="" className="w-full h-full object-cover" />
                                            : (device.map_icon ?? '📡')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{device.name}</p>
                                        <p className="text-[10px] font-mono text-gray-300 dark:text-gray-600 truncate">{device.imei}</p>
                                    </div>
                                    {activeIncCount > 0 && (
                                        <span className="shrink-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                            {activeIncCount > 9 ? '9+' : activeIncCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 pl-10">
                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[st]}`} />
                                    <span className={`text-xs font-medium ${st === 'online' ? 'text-green-600' : st === 'offline' ? 'text-red-500' : 'text-gray-400'}`}>
                                        {STATUS_LABEL[st]}
                                    </span>
                                    {device.battery_percent != null && (
                                        <span className={`text-xs ml-auto ${device.battery_percent < 20 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                            🔋{device.battery_percent}%
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {/* Register device button at bottom */}
                    <div className="mt-auto p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
                        <button onClick={onRegisterClick}
                            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            Register Device
                        </button>
                    </div>
                </div>

                {/* Beats list */}
                <div className={`flex-1 overflow-y-auto flex flex-col ${activeTab !== 'beats' ? 'hidden' : ''}`}>
                    {beats.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <p className="text-2xl mb-2">📍</p>
                            <p className="text-xs text-gray-400 mb-3">No beats yet.</p>
                        </div>
                    ) : beats.map(beat => (
                        <button key={beat.id} id={`beat-${beat.id}`}
                            onClick={() => focusBeat(beat.id)}
                            className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 transition-all border-l-2
                                ${selectedBeat === beat.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
                                    : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <div className="flex items-center gap-2.5">
                                <span className="shrink-0 w-3 h-3 rounded-sm mt-0.5" style={{ background: beat.color ?? '#2563eb' }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{beat.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${BEAT_STATUS_DOT[beat.status] ?? 'bg-gray-400'}`} />
                                        <span className="text-[10px] text-gray-400 capitalize">{beat.status}</span>
                                        {beat.coordinates?.length > 0 && (
                                            <span className="text-[10px] text-gray-300 ml-auto">{beat.coordinates.length} pts</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}

                    <div className="mt-auto p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-1.5">
                        <a href="/my/beats/create"
                            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            Create Beat
                        </a>
                        <button onClick={() => setShowImport(true)}
                            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 py-2 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import KML / KMZ
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CENTER: Live Map ─────────────────────────────────────────── */}
            <div className="flex-1 relative min-w-0">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center p-8 text-center">
                        <div>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="text-sm text-gray-500">
                                Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
                            </p>
                        </div>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}

                {/* Live / connecting badge */}
                {mapsReady && (
                    <div className="absolute bottom-4 left-4">
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow border
                            ${realtimeConnected
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                : 'bg-white border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            {realtimeConnected ? 'Live' : 'Connecting…'}
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Incidents panel ───────────────────────────────────── */}
            <div className="w-72 shrink-0 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Incidents
                            {visibleIncidents.length > 0 && (
                                <span className="ml-1.5 text-[10px] font-normal text-gray-400">({visibleIncidents.length})</span>
                            )}
                        </p>
                        {(selectedDev || selectedBeat) && (
                            <button
                                onClick={() => { setSelectedDev(null); setSelectedBeat(null); }}
                                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                                Show all
                            </button>
                        )}
                    </div>
                    {(selectedDev || selectedBeat) && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            Filtered by: {selectedDev
                                ? devices.find(d => d.id === selectedDev)?.name
                                : beats.find(b => b.id === selectedBeat)?.name}
                        </p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {visibleIncidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <p className="text-2xl mb-2">✅</p>
                            <p className="text-xs text-gray-400">No incidents in the last 3 days.</p>
                        </div>
                    ) : visibleIncidents.map(incident => (
                        <div key={incident.id}
                            className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${INCIDENT_STATUS_DOT[incident.status] ?? 'bg-gray-400'}`} />
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low}`}>
                                    {incident.priority}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-auto capitalize">{incident.status}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                                {incident.event_type.replace(/_/g, ' ')}
                            </p>
                            {incident.device && (
                                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{incident.device.name}</p>
                            )}
                            {incident.beat && (
                                <p className="text-[10px] text-gray-400 truncate">Beat: {incident.beat.name}</p>
                            )}
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                {new Date(incident.triggered_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
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
            <div className={`fixed top-16 right-0 bottom-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {drawerDevice && (
                    <>
                        {/* Drawer header */}
                        <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                            {/* Device photo */}
                            <label className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl cursor-pointer group">
                                {drawerDevice.image_url
                                    ? <img src={drawerDevice.image_url} alt="" className="w-full h-full object-cover" />
                                    : (drawerDevice.map_icon ?? '📡')}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {uploadingImage
                                        ? <span className="text-white text-[10px]">…</span>
                                        : <Camera className="w-4 h-4 text-white" />}
                                </div>
                                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{drawerDevice.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono truncate">{drawerDevice.imei}</p>
                            </div>
                            <button onClick={closeDrawer} className="shrink-0 text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer sub-tabs */}
                        <div className="shrink-0 flex border-b border-gray-100 dark:border-gray-800">
                            {(['info', 'notif'] as const).map(t => (
                                <button key={t} onClick={() => setEditTab(t)}
                                    className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2
                                        ${editTab === t
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                    {t === 'info' ? 'Info & Edit' : 'Notifications'}
                                </button>
                            ))}
                        </div>

                        {drawerError && (
                            <div className="mx-4 mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {drawerError}
                            </div>
                        )}

                        {/* Drawer body */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                            {editTab === 'info' && (
                                <>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Device Name</label>
                                        <div className="flex gap-2">
                                            <input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveDevice(); }}
                                                className="flex-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">Assignee / Notes</label>
                                        <textarea
                                            value={editNotes}
                                            onChange={e => setEditNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Add notes about this device or its assignee…"
                                            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                                        />
                                    </div>

                                    <button onClick={saveDevice} disabled={saving}
                                        className="w-full py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </button>

                                    {/* Beat assignment */}
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Beat (Geofence)</p>
                                        {drawerDevice.current_beat ? (
                                            <div className="flex items-center gap-2 mb-2 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: drawerDevice.current_beat.color }} />
                                                <span className="text-xs font-medium flex-1 truncate">{drawerDevice.current_beat.name}</span>
                                                <button onClick={() => unassignBeat(drawerDevice.id)} disabled={beatAssigning}
                                                    className="text-[10px] text-red-500 hover:text-red-700 font-medium disabled:opacity-40">
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 mb-2">Not assigned to any beat.</p>
                                        )}
                                        {beats.length > 0 && (
                                            <select
                                                value={drawerDevice.current_beat?.id ?? ''}
                                                onChange={e => { const id = Number(e.target.value); if (id) assignBeat(drawerDevice.id, id); }}
                                                disabled={beatAssigning}
                                                className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-40">
                                                <option value="">{beatAssigning ? 'Saving…' : '— Assign beat —'}</option>
                                                {beats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        )}
                                    </div>

                                    {/* Status + location */}
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[getMyStatus(drawerDevice)]}`} />
                                            <span className="text-xs font-medium">{STATUS_LABEL[getMyStatus(drawerDevice)]}</span>
                                            {drawerDevice.battery_percent != null && (
                                                <span className="ml-auto text-xs text-gray-500">🔋 {drawerDevice.battery_percent}%</span>
                                            )}
                                        </div>
                                        {drawerDevice.last_signal_at && (
                                            <p className="text-[10px] text-gray-400">
                                                Last seen {new Date(drawerDevice.last_signal_at).toLocaleString()}
                                            </p>
                                        )}
                                        {drawerDevice.last_lat != null && (
                                            <p className="text-[10px] font-mono text-gray-500">
                                                {Number(drawerDevice.last_lat).toFixed(6)}, {Number(drawerDevice.last_lon).toFixed(6)}
                                            </p>
                                        )}
                                    </div>

                                    {drawerDevice.device_type && (
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Device Type</p>
                                            <p className="text-xs font-medium">{drawerDevice.device_type.name}</p>
                                        </div>
                                    )}

                                    {/* Unlink device */}
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                        {unlinkConfirm ? (
                                            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-3 space-y-2">
                                                <p className="text-xs font-medium text-red-700 dark:text-red-400">Remove this device from your account?</p>
                                                <p className="text-[10px] text-red-600 dark:text-red-500">You can re-register it later using the device ID.</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setUnlinkConfirm(false)}
                                                        className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                        Cancel
                                                    </button>
                                                    <button onClick={unlinkDevice} disabled={unlinking}
                                                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors">
                                                        {unlinking ? 'Removing…' : 'Yes, remove'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setUnlinkConfirm(true)}
                                                className="w-full py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                Unlink Device
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {editTab === 'notif' && (
                                <>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Toggle SMS alerts per incident type. Turning one off silences it for 24 hours.
                                    </p>
                                    {notifLoading ? (
                                        <div className="text-xs text-gray-400 py-4 text-center">Loading…</div>
                                    ) : (
                                        <>
                                            <div className="space-y-1">
                                                {notifPrefs.map(pref => {
                                                    const isDisabledUntil = pref.sms_disabled_until && new Date(pref.sms_disabled_until) > new Date();
                                                    return (
                                                        <button key={pref.event_type}
                                                            onClick={() => toggleNotif(pref.event_type)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left
                                                                ${pref.sms_enabled
                                                                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'}`}>
                                                            {pref.sms_enabled
                                                                ? <Bell className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                                : <BellOff className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                                            <span className="flex-1 text-xs font-medium text-gray-800 dark:text-gray-200">{pref.label}</span>
                                                            {isDisabledUntil && (
                                                                <span className="text-[9px] text-orange-500 shrink-0">24h off</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button onClick={saveNotifPrefs} disabled={notifSaving}
                                                className="w-full py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
                                                {notifSaving ? 'Saving…' : 'Save Preferences'}
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
