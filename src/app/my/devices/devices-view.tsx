'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident, Beat } from '@/lib/api-client';

interface Props {
    devices:           Device[];
    incidents:         Incident[];
    beats:             Beat[];
    token:             string;
    realtimeConnected?: boolean;
}

const MAPS_KEY    = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const API_URL_PUB = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

const ICON_PRESETS = ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚚','🚛','🚜','🏍','🛵','🚲','🚘','📡','🔵','🔴','🟡'];

type MyStatus = 'online' | 'offline' | 'unavailable';

function getMyStatus(device: Device): MyStatus {
    if (!device.last_signal_at) return 'unavailable';
    const mins = (Date.now() - new Date(device.last_signal_at).getTime()) / 60_000;
    if (mins <= 30)   return 'online';
    if (mins <= 1440) return 'offline';
    return 'unavailable';
}

const STATUS_LABEL: Record<MyStatus, string> = {
    online: 'Online', offline: 'Offline', unavailable: 'Unavailable',
};

const STATUS_DOT: Record<MyStatus, string> = {
    online: 'bg-green-500', offline: 'bg-red-500', unavailable: 'bg-gray-400',
};

const STATUS_MARKER_COLOR: Record<MyStatus, string> = {
    online: '#16a34a', offline: '#dc2626', unavailable: '#9ca3af',
};

const PRIORITY_BADGE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-yellow-100 text-yellow-700',
    low:      'bg-gray-100 text-gray-600',
};

const INCIDENT_DOT: Record<string, string> = {
    open: 'bg-red-500', acknowledged: 'bg-orange-400', escalated: 'bg-purple-500',
};

const BEAT_STATUS_DOT: Record<string, string> = {
    active: 'bg-green-500', inactive: 'bg-gray-400', draft: 'bg-yellow-400',
};

const BEAT_STATUS_LABEL: Record<string, string> = {
    active: 'Active', inactive: 'Inactive', draft: 'Draft',
};

export default function DevicesView({ devices: incomingDevices, incidents, beats, token, realtimeConnected }: Props) {
    const [devices,        setDevices]        = useState<Device[]>(incomingDevices);
    const [activeTab,      setActiveTab]      = useState<'devices' | 'beats'>('devices');
    const [drawerDevId,    setDrawerDevId]    = useState<number | null>(null);
    const [selectedBeat,   setSelectedBeat]   = useState<number | null>(null);
    const [mapsReady,      setMapsReady]      = useState(false);
    const [editingId,      setEditingId]      = useState<number | null>(null);
    const [editName,       setEditName]       = useState('');
    const [iconPickFor,    setIconPickFor]    = useState<number | null>(null);
    const [saving,         setSaving]         = useState(false);
    const [beatAssigning,  setBeatAssigning]  = useState(false);

    const mapRef     = useRef<HTMLDivElement>(null);
    const gmapRef    = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
    const polysRef   = useRef<Map<number, google.maps.Polygon>>(new Map());
    const infoRef    = useRef<google.maps.InfoWindow | null>(null);

    const openIncidents  = incidents.filter(i => ['open','acknowledged','escalated'].includes(i.status));
    const deviceAlerts   = (id: number) => openIncidents.filter(i => i.device?.id === id);
    const drawerDevice   = drawerDevId != null ? devices.find(d => d.id === drawerDevId) ?? null : null;

    // ── Load Google Maps ──────────────────────────────────────────────────
    useEffect(() => {
        if (typeof google !== 'undefined') { setMapsReady(true); return; }
        if (!MAPS_KEY) return;
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
        s.async = true;
        s.onload = () => setMapsReady(true);
        document.head.appendChild(s);
    }, []);

    // ── Init map: device markers + beat polygons ──────────────────────────
    useEffect(() => {
        if (!mapsReady || !mapRef.current || gmapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
            center: { lat: 31.5204, lng: 74.3587 },
            zoom: 10,
            mapTypeId: 'roadmap',
            fullscreenControl: false,
            streetViewControl: false,
        });
        gmapRef.current = map;
        infoRef.current = new google.maps.InfoWindow();

        const bounds  = new google.maps.LatLngBounds();
        let hasBounds = false;

        // Device markers
        devices.filter(d => d.last_lat != null && d.last_lon != null).forEach(device => {
            const lat = Number(device.last_lat);
            const lng = Number(device.last_lon);
            if (isNaN(lat) || isNaN(lng)) return;

            const st     = getMyStatus(device);
            const marker = new google.maps.Marker({
                position: { lat, lng },
                map,
                title: device.name,
                label: device.map_icon ? { text: device.map_icon, fontSize: '18px' } : undefined,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: STATUS_MARKER_COLOR[st],
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                },
            });
            marker.addListener('click', () => openDrawer(device.id, map));
            markersRef.current.set(device.id, marker);
            bounds.extend({ lat, lng });
            hasBounds = true;
        });

        // Beat polygons
        beats.forEach(beat => {
            if (!beat.coordinates?.length) return;
            const poly = new google.maps.Polygon({
                paths: beat.coordinates,
                fillColor: beat.color ?? '#2563eb',
                fillOpacity: 0.15,
                strokeColor: beat.color ?? '#2563eb',
                strokeWeight: 2,
                map,
            });
            polysRef.current.set(beat.id, poly);
            poly.addListener('click', () => focusBeat(beat.id));
            beat.coordinates.forEach(v => { bounds.extend(v); hasBounds = true; });
        });

        if (hasBounds) map.fitBounds(bounds, 80);
    }, [mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Sync realtime device updates from parent (location, status, battery) ─
    // Preserves local user edits (name, map_icon) — only overwrites server fields.
    useEffect(() => {
        setDevices(prev => {
            const prevMap = Object.fromEntries(prev.map(d => [d.id, d]));
            return incomingDevices.map(incoming => ({
                ...incoming,
                // Keep local name/icon edits the user may have made in this session
                name:     prevMap[incoming.id]?.name     ?? incoming.name,
                map_icon: prevMap[incoming.id]?.map_icon ?? incoming.map_icon,
            }));
        });
    }, [incomingDevices]);

    // ── Update Google Maps markers when realtime positions change ──────────
    useEffect(() => {
        if (!gmapRef.current || !mapsReady) return;

        devices.forEach(device => {
            const lat = Number(device.last_lat);
            const lng = Number(device.last_lon);
            const st  = getMyStatus(device);
            const isSelected = drawerDevId === device.id;

            const iconConfig = {
                path:         google.maps.SymbolPath.CIRCLE,
                scale:        isSelected ? 13 : 9,
                fillColor:    STATUS_MARKER_COLOR[st],
                fillOpacity:  1,
                strokeColor:  '#fff',
                strokeWeight: isSelected ? 3 : 2,
            };

            const existing = markersRef.current.get(device.id);

            if (existing) {
                if (!isNaN(lat) && !isNaN(lng)) existing.setPosition({ lat, lng });
                existing.setIcon(iconConfig);
                if (device.name) existing.setTitle(device.name);
            } else if (!isNaN(lat) && !isNaN(lng) && gmapRef.current) {
                // New device appeared via realtime — add marker
                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map: gmapRef.current,
                    title: device.name,
                    label: device.map_icon ? { text: device.map_icon, fontSize: '18px' } : undefined,
                    icon: iconConfig,
                });
                marker.addListener('click', () => openDrawer(device.id));
                markersRef.current.set(device.id, marker);
            }
        });
    }, [devices, drawerDevId, mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Open device drawer ────────────────────────────────────────────────
    const openDrawer = useCallback((id: number, map?: google.maps.Map) => {
        const m = map ?? gmapRef.current;

        // Reset all markers to default scale
        markersRef.current.forEach((mk, mid) => {
            const d  = devices.find(x => x.id === mid);
            const st = d ? getMyStatus(d) : 'unavailable';
            mk.setIcon({ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: STATUS_MARKER_COLOR[st], fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 });
        });

        // Enlarge selected marker
        const marker = markersRef.current.get(id);
        const device = devices.find(d => d.id === id);
        if (marker && device) {
            const st = getMyStatus(device);
            marker.setIcon({ path: google.maps.SymbolPath.CIRCLE, scale: 13, fillColor: STATUS_MARKER_COLOR[st], fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 });
        }

        if (device && m) {
            const lat = Number(device.last_lat);
            const lng = Number(device.last_lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                m.panTo({ lat, lng });
                if ((m.getZoom() ?? 10) < 13) setTimeout(() => m.setZoom(15), 250);
            }
        }

        infoRef.current?.close();
        setDrawerDevId(id);
        window.history.pushState(null, '', `/my/devices/${id}`);
        document.getElementById(`device-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [devices]);

    // ── Close device drawer ───────────────────────────────────────────────
    const closeDrawer = useCallback(() => {
        markersRef.current.forEach((mk, mid) => {
            const d  = devices.find(x => x.id === mid);
            const st = d ? getMyStatus(d) : 'unavailable';
            mk.setIcon({ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: STATUS_MARKER_COLOR[st], fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 });
        });
        setDrawerDevId(null);
        window.history.pushState(null, '', '/my/devices');
    }, [devices]);

    // ── Focus beat on map ─────────────────────────────────────────────────
    function focusBeat(id: number) {
        const m = gmapRef.current;

        polysRef.current.forEach((p, pid) => {
            const beat = beats.find(b => b.id === pid);
            p.setOptions({ fillOpacity: 0.15, strokeWeight: 2, strokeColor: beat?.color ?? '#2563eb', fillColor: beat?.color ?? '#2563eb', zIndex: 1 });
        });
        const poly = polysRef.current.get(id);
        if (poly) poly.setOptions({ fillOpacity: 0.35, strokeWeight: 3, zIndex: 10 });

        const beat = beats.find(b => b.id === id);
        if (beat?.coordinates?.length && m) {
            const b = new google.maps.LatLngBounds();
            beat.coordinates.forEach(v => b.extend(v));
            m.panTo(b.getCenter());
            setTimeout(() => m.fitBounds(b, 80), 300);
        }

        setSelectedBeat(id);
        document.getElementById(`beat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Inline name edit ──────────────────────────────────────────────────
    function startEdit(device: Device, e: React.MouseEvent) {
        e.stopPropagation();
        setEditingId(device.id);
        setEditName(device.name);
        setIconPickFor(null);
    }

    async function commitEdit(id: number) {
        if (!editName.trim()) { setEditingId(null); return; }
        setSaving(true);
        try {
            const res = await fetch(`${API_URL_PUB}/api/my/devices/${id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            });
            if (res.ok) {
                const updated: Device = await res.json();
                setDevices(prev => prev.map(d => d.id === id ? updated : d));
                markersRef.current.get(id)?.setTitle(updated.name);
            }
        } finally { setSaving(false); setEditingId(null); }
    }

    async function pickIcon(id: number, icon: string) {
        setIconPickFor(null);
        const res = await fetch(`${API_URL_PUB}/api/my/devices/${id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ map_icon: icon }),
        });
        if (res.ok) {
            const updated: Device = await res.json();
            setDevices(prev => prev.map(d => d.id === id ? updated : d));
            const marker = markersRef.current.get(id);
            if (marker) marker.setLabel({ text: icon, fontSize: '18px' });
        }
    }

    async function assignBeat(deviceId: number, beatId: number) {
        setBeatAssigning(true);
        try {
            const api = new ApiClient(token);
            const { beat } = await api.assignBeat(deviceId, beatId);
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, current_beat: beat } : d));
        } finally {
            setBeatAssigning(false);
        }
    }

    async function unassignBeat(deviceId: number) {
        setBeatAssigning(true);
        try {
            const api = new ApiClient(token);
            await api.unassignBeat(deviceId);
            setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, current_beat: null } : d));
        } finally {
            setBeatAssigning(false);
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden" onClick={() => setIconPickFor(null)}>

            {/* ── Left panel: Devices / Beats tabs ─────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

                {/* Tab bar */}
                <div className="shrink-0 flex border-b border-gray-200 dark:border-gray-800">
                    {(['devices', 'beats'] as const).map(tab => (
                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2
                                ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            {tab === 'devices' ? `Devices (${devices.length})` : `Beats (${beats.length})`}
                        </button>
                    ))}
                </div>

                {/* Devices list */}
                <div className={`flex-1 overflow-y-auto ${activeTab !== 'devices' ? 'hidden' : ''}`}>
                    {devices.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-3xl mb-2">📡</p>
                            <p className="text-xs text-gray-400">No devices assigned yet.</p>
                        </div>
                    ) : devices.map(device => {
                        const st     = getMyStatus(device);
                        const alerts = deviceAlerts(device.id).length;
                        const isSel  = drawerDevId === device.id;
                        const isEdit = editingId   === device.id;

                        return (
                            <div key={device.id} id={`device-${device.id}`}
                                onClick={() => !isEdit && openDrawer(device.id)}
                                className={`px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all
                                    ${isSel
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                                        : 'border-l-2 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>

                                <div className="flex items-center gap-2">
                                    <div className="relative shrink-0">
                                        <button
                                            onClick={e => { e.stopPropagation(); setIconPickFor(iconPickFor === device.id ? null : device.id); }}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            title="Change icon">
                                            {device.map_icon ?? '📡'}
                                        </button>
                                        {iconPickFor === device.id && (
                                            <div onClick={e => e.stopPropagation()}
                                                className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-44 grid grid-cols-5 gap-0.5">
                                                {ICON_PRESETS.map(ic => (
                                                    <button key={ic} onClick={() => pickIcon(device.id, ic)}
                                                        className="text-xl p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                        {ic}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {isEdit ? (
                                        <div className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                                            <input autoFocus value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(device.id); if (e.key === 'Escape') setEditingId(null); }}
                                                className="flex-1 min-w-0 text-xs font-semibold bg-white dark:bg-gray-700 border border-blue-400 rounded px-1.5 py-0.5 outline-none" />
                                            <button onClick={() => commitEdit(device.id)} disabled={saving}
                                                className="text-green-600 hover:text-green-700 shrink-0"><Check className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setEditingId(null)}
                                                className="text-gray-400 hover:text-gray-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 min-w-0 flex items-center gap-1.5 group">
                                            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate flex-1">{device.name}</span>
                                            <button onClick={e => startEdit(device, e)}
                                                className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-gray-500 transition-all shrink-0">
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    {alerts > 0 && (
                                        <span className="shrink-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                            {alerts}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-1.5 pl-10">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[st]}`} />
                                    <span className={`text-xs font-medium ${st === 'online' ? 'text-green-600' : st === 'offline' ? 'text-red-500' : 'text-gray-400'}`}>
                                        {STATUS_LABEL[st]}
                                    </span>
                                    {device.battery_percent != null && (
                                        <span className={`text-xs ml-auto ${device.battery_percent < 20 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                            🔋{device.battery_percent}%
                                        </span>
                                    )}
                                </div>

                                <p className="pl-10 mt-0.5 text-[10px] text-gray-300 dark:text-gray-600 font-mono truncate">{device.imei}</p>
                                {device.last_lat == null && (
                                    <p className="pl-10 mt-0.5 text-[10px] text-gray-300">No location</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Beats list */}
                <div className={`flex-1 overflow-y-auto ${activeTab !== 'beats' ? 'hidden' : ''}`}>
                    {beats.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-3xl mb-2">📍</p>
                            <p className="text-xs text-gray-400">No beats yet.</p>
                        </div>
                    ) : beats.map(beat => (
                        <button key={beat.id} id={`beat-${beat.id}`}
                            onClick={() => focusBeat(beat.id)}
                            className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 transition-all
                                ${selectedBeat === beat.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                                    : 'border-l-2 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <div className="flex items-start gap-2.5">
                                <span className="shrink-0 w-3 h-3 rounded-sm mt-0.5"
                                    style={{ background: beat.color ?? '#2563eb' }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{beat.name}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${BEAT_STATUS_DOT[beat.status] ?? 'bg-gray-400'}`} />
                                        <span className="text-[10px] text-gray-400">{BEAT_STATUS_LABEL[beat.status] ?? beat.status}</span>
                                        {beat.coordinates?.length > 0 && (
                                            <span className="text-[10px] text-gray-300 ml-auto">{beat.coordinates.length} pts</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Map ──────────────────────────────────────────────────── */}
            <div className="flex-1 relative min-w-0">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center p-8 text-center">
                        <div>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="text-sm text-gray-500">Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.</p>
                        </div>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}

                {mapsReady && (
                    <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                        {/* Live connection badge */}
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow border
                            ${realtimeConnected
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                : 'bg-white border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            {realtimeConnected ? 'Live' : 'Connecting…'}
                        </div>

                        {/* Map legend */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-xs space-y-1.5">
                            {(['online','offline','unavailable'] as MyStatus[]).map(s => (
                                <div key={s} className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]}`} />
                                    <span className="capitalize text-gray-600 dark:text-gray-400">{STATUS_LABEL[s]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Device detail drawer ─────────────────────────────────── */}
            {drawerDevId != null && (
                <div className="fixed inset-0 z-40" onClick={closeDrawer} />
            )}
            <div className={`fixed top-16 right-0 bottom-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out ${drawerDevId != null ? 'translate-x-0' : 'translate-x-full'}`}>
                {drawerDevice && (() => {
                    const st            = getMyStatus(drawerDevice);
                    const devIncidents  = deviceAlerts(drawerDevice.id);

                    return (
                        <>
                            {/* Drawer header */}
                            <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl bg-gray-100 dark:bg-gray-800 shrink-0">
                                    {drawerDevice.map_icon ?? '📡'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{drawerDevice.name}</p>
                                    <p className="text-[10px] text-gray-400 font-mono truncate">{drawerDevice.imei}</p>
                                </div>
                                <button onClick={closeDrawer}
                                    className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Drawer body */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                                {/* Status + battery */}
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[st]}`} />
                                    <span className={`text-sm font-medium ${st === 'online' ? 'text-green-600' : st === 'offline' ? 'text-red-500' : 'text-gray-400'}`}>
                                        {STATUS_LABEL[st]}
                                    </span>
                                    {drawerDevice.battery_percent != null && (
                                        <span className={`ml-auto text-sm ${drawerDevice.battery_percent < 20 ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                            🔋 {drawerDevice.battery_percent}%
                                        </span>
                                    )}
                                </div>

                                {drawerDevice.last_signal_at && (
                                    <p className="text-xs text-gray-400">
                                        Last seen {new Date(drawerDevice.last_signal_at).toLocaleString()}
                                    </p>
                                )}

                                {/* Device type */}
                                {drawerDevice.device_type && (
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Device Type</p>
                                        <p className="text-xs font-medium text-gray-800 dark:text-white">{drawerDevice.device_type.name}</p>
                                    </div>
                                )}

                                {/* Tenant */}
                                {drawerDevice.tenant && (
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Tenant</p>
                                        <p className="text-xs font-medium text-gray-800 dark:text-white">{drawerDevice.tenant.name}</p>
                                    </div>
                                )}

                                {/* Last location */}
                                {drawerDevice.last_lat != null && (
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2.5">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Last Location</p>
                                        <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300">
                                            {Number(drawerDevice.last_lat).toFixed(6)}, {Number(drawerDevice.last_lon).toFixed(6)}
                                        </p>
                                    </div>
                                )}

                                {/* Beat assignment */}
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Beat (Geofence)</p>
                                    {drawerDevice.current_beat ? (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                                                style={{ background: drawerDevice.current_beat.color }} />
                                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 flex-1">
                                                {drawerDevice.current_beat.name}
                                            </span>
                                            <button
                                                onClick={() => unassignBeat(drawerDevice.id)}
                                                disabled={beatAssigning}
                                                className="text-[10px] text-red-500 hover:text-red-700 font-medium disabled:opacity-40 shrink-0">
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 mb-2">Not assigned to any beat</p>
                                    )}
                                    {beats.length > 0 && (
                                        <select
                                            value={drawerDevice.current_beat?.id ?? ''}
                                            onChange={e => {
                                                const id = Number(e.target.value);
                                                if (id) assignBeat(drawerDevice.id, id);
                                            }}
                                            disabled={beatAssigning}
                                            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-40">
                                            <option value="">
                                                {beatAssigning ? 'Saving…' : '— Assign to beat —'}
                                            </option>
                                            {beats.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Map icon picker */}
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Map Icon</p>
                                    <div className="grid grid-cols-10 gap-0.5">
                                        {ICON_PRESETS.map(ic => (
                                            <button key={ic} onClick={() => pickIcon(drawerDevice.id, ic)}
                                                className={`text-base p-1 rounded transition-colors ${drawerDevice.map_icon === ic ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Active incidents */}
                                {devIncidents.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">
                                            Active Incidents ({devIncidents.length})
                                        </p>
                                        <div className="space-y-2">
                                            {devIncidents.map(incident => (
                                                <div key={incident.id}
                                                    className="rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2.5">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${INCIDENT_DOT[incident.status] ?? 'bg-gray-400'}`} />
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low}`}>
                                                            {incident.priority}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                                                        {incident.event_type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(incident.triggered_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
