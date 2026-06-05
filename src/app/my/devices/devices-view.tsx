'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import type { Device, Incident } from '@/lib/api-client';

interface Props { devices: Device[]; incidents: Incident[]; token: string }

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

export default function DevicesView({ devices: initialDevices, incidents, token }: Props) {
    const [devices,    setDevices]    = useState<Device[]>(initialDevices);
    const mapRef      = useRef<HTMLDivElement>(null);
    const gmapRef     = useRef<google.maps.Map | null>(null);
    const markersRef  = useRef<Map<number, google.maps.Marker>>(new Map());
    const infoRef     = useRef<google.maps.InfoWindow | null>(null);
    const [selected,  setSelected]   = useState<number | null>(null);
    const [mapsReady, setMapsReady]  = useState(false);
    const [editingId, setEditingId]  = useState<number | null>(null);
    const [editName,  setEditName]   = useState('');
    const [iconPickFor, setIconPickFor] = useState<number | null>(null);
    const [saving,    setSaving]     = useState(false);

    const mappable      = devices.filter(d => d.last_lat != null && d.last_lon != null);
    const openIncidents = incidents.filter(i => ['open','acknowledged','escalated'].includes(i.status));
    const deviceAlerts  = (id: number) => openIncidents.filter(i => i.device?.id === id).length;

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

    // ── Init map + markers ────────────────────────────────────────────────
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

        const bounds = new google.maps.LatLngBounds();
        let hasBounds = false;

        mappable.forEach(device => {
            const st = getMyStatus(device);
            const marker = new google.maps.Marker({
                position: { lat: device.last_lat!, lng: device.last_lon! },
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
            marker.addListener('click', () => selectDevice(device.id, map));
            markersRef.current.set(device.id, marker);
            bounds.extend({ lat: device.last_lat!, lng: device.last_lon! });
            hasBounds = true;
        });

        if (hasBounds) map.fitBounds(bounds, 80);
    }, [mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectDevice = useCallback((id: number, map?: google.maps.Map) => {
        const m = map ?? gmapRef.current;
        if (!m) return;

        // Reset all markers
        markersRef.current.forEach((mk, mid) => {
            const d = devices.find(x => x.id === mid);
            const st = d ? getMyStatus(d) : 'unavailable';
            mk.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: STATUS_MARKER_COLOR[st],
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
            });
        });

        const marker = markersRef.current.get(id);
        const device = devices.find(d => d.id === id);

        if (marker && device) {
            const st = getMyStatus(device);
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 13,
                fillColor: STATUS_MARKER_COLOR[st],
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
            });

            const battery  = device.battery_percent != null ? `🔋 ${device.battery_percent}%` : '';
            const lastSeen = device.last_signal_at
                ? `Last seen ${new Date(device.last_signal_at).toLocaleString()}`
                : 'No signal';
            infoRef.current?.setContent(`
                <div style="font-size:13px;min-width:160px;padding:2px 0">
                    <strong style="font-size:14px">${device.map_icon ?? ''} ${device.name}</strong><br/>
                    <span style="color:#6b7280;font-size:11px">${device.imei}</span><br/>
                    <span style="font-size:11px">${battery} ${lastSeen}</span>
                </div>
            `);
            infoRef.current?.open(m, marker);

            // Animated move: smooth pan then zoom in
            m.panTo({ lat: device.last_lat!, lng: device.last_lon! });
            if ((m.getZoom() ?? 10) < 13) setTimeout(() => m.setZoom(15), 250);
        } else {
            infoRef.current?.close();
        }

        setSelected(id);
        document.getElementById(`device-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [devices]);

    // ── Name edit ─────────────────────────────────────────────────────────
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

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden" onClick={() => setIconPickFor(null)}>

            {/* ── Device list ──────────────────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">My Devices</span>
                    <span className="text-xs text-gray-400">{devices.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {devices.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-3xl mb-2">📡</p>
                            <p className="text-xs text-gray-400">No devices assigned yet.</p>
                        </div>
                    ) : devices.map(device => {
                        const st      = getMyStatus(device);
                        const alerts  = deviceAlerts(device.id);
                        const isSel   = selected === device.id;
                        const isEdit  = editingId === device.id;

                        return (
                            <div key={device.id} id={`device-${device.id}`}
                                onClick={() => !isEdit && selectDevice(device.id)}
                                className={`px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all
                                    ${isSel ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>

                                {/* Icon + name row */}
                                <div className="flex items-center gap-2">
                                    {/* Icon button */}
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

                                    {/* Name (editable) */}
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

                                {/* Status + battery */}
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

                                {/* IMEI */}
                                <p className="pl-10 mt-0.5 text-[10px] text-gray-300 dark:text-gray-600 font-mono truncate">{device.imei}</p>

                                {device.last_lat == null && (
                                    <p className="pl-10 mt-0.5 text-[10px] text-gray-300">No location</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Map ──────────────────────────────────────────────── */}
            <div className="flex-[3] relative min-w-0">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center p-8 text-center">
                        <div>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="text-sm text-gray-500">Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.</p>
                        </div>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}

                {mapsReady && (
                    <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-xs space-y-1.5">
                        {(['online','offline','unavailable'] as MyStatus[]).map(s => (
                            <div key={s} className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]}`} />
                                <span className="capitalize text-gray-600 dark:text-gray-400">{STATUS_LABEL[s]}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Incidents ────────────────────────────────────────── */}
            <div className="w-56 shrink-0 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">Incidents</span>
                    {openIncidents.length > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-semibold">
                            {openIncidents.length}
                        </span>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {openIncidents.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-2xl mb-2">✅</p>
                            <p className="text-xs text-gray-400">No active incidents.</p>
                        </div>
                    ) : openIncidents.map(incident => (
                        <div key={incident.id}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${incident.device && selected === incident.device.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${INCIDENT_DOT[incident.status] ?? 'bg-gray-400'}`} />
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low}`}>
                                    {incident.priority}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize">
                                {incident.event_type.replace(/_/g, ' ')}
                            </p>
                            {incident.device && (
                                <button onClick={() => selectDevice(incident.device!.id)}
                                    className="text-xs text-blue-600 hover:underline mt-0.5 block text-left truncate w-full">
                                    {incident.device.name}
                                </button>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(incident.triggered_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
