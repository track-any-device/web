'use client';

import { useState, useEffect, useRef } from 'react';
import type { Device, Incident } from '@/lib/api-client';

interface Props { devices: Device[]; incidents: Incident[] }

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const STATUS_COLOR: Record<string, string> = {
    active:    '#16a34a',
    inactive:  '#9ca3af',
    offline:   '#dc2626',
    inventory: '#2563eb',
};

const STATUS_DOT: Record<string, string> = {
    active:    'bg-green-500',
    inactive:  'bg-gray-400',
    offline:   'bg-red-500',
    inventory: 'bg-blue-500',
};

const PRIORITY_BADGE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const INCIDENT_STATUS_COLOR: Record<string, string> = {
    open:         'bg-red-500',
    acknowledged: 'bg-orange-400',
    escalated:    'bg-purple-500',
};

export default function DevicesView({ devices, incidents }: Props) {
    const mapRef      = useRef<HTMLDivElement>(null);
    const gmapRef     = useRef<google.maps.Map | null>(null);
    const markersRef  = useRef<Map<number, google.maps.Marker>>(new Map());
    const infoRef     = useRef<google.maps.InfoWindow | null>(null);
    const [selected,  setSelected]  = useState<number | null>(null);
    const [mapsReady, setMapsReady] = useState(false);

    const mappable = devices.filter(d => d.last_lat != null && d.last_lon != null);

    // ── Load Maps API ─────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof google !== 'undefined') { setMapsReady(true); return; }
        if (!MAPS_KEY) return;
        const s = document.createElement('script');
        s.src   = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
        s.async = true;
        s.onload = () => setMapsReady(true);
        document.head.appendChild(s);
    }, []);

    // ── Init map + place device markers ───────────────────────────────────
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
            const marker = new google.maps.Marker({
                position: { lat: device.last_lat!, lng: device.last_lon! },
                map,
                title: device.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: STATUS_COLOR[device.status] ?? '#6b7280',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                },
                zIndex: 5,
            });

            marker.addListener('click', () => selectDevice(device.id, map));
            markersRef.current.set(device.id, marker);
            bounds.extend({ lat: device.last_lat!, lng: device.last_lon! });
            hasBounds = true;
        });

        if (hasBounds) map.fitBounds(bounds, 80);
    }, [mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

    function selectDevice(id: number, map?: google.maps.Map) {
        const m = map ?? gmapRef.current;
        if (!m) return;

        // Reset all markers
        markersRef.current.forEach((mk, mid) => {
            const d = devices.find(x => x.id === mid);
            mk.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: STATUS_COLOR[d?.status ?? ''] ?? '#6b7280',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
                zIndex: 5,
            });
        });

        const marker = markersRef.current.get(id);
        const device = devices.find(d => d.id === id);

        if (marker && device) {
            // Enlarge selected marker
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 13,
                fillColor: STATUS_COLOR[device.status] ?? '#6b7280',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 3,
            });

            // Info window
            const battery = device.battery_percent != null ? `🔋 ${device.battery_percent}%` : '';
            const lastSeen = device.last_signal_at
                ? `Last seen ${new Date(device.last_signal_at).toLocaleString()}`
                : 'No signal yet';

            infoRef.current?.setContent(`
                <div style="font-size:13px;min-width:140px">
                    <strong>${device.name}</strong><br/>
                    <span style="color:#6b7280;font-size:11px">${device.imei}</span><br/>
                    <span style="font-size:11px">${battery} ${lastSeen}</span>
                </div>
            `);
            infoRef.current?.open(m, marker);
            m.panTo({ lat: device.last_lat!, lng: device.last_lon! });
            m.setZoom(14);
        } else {
            infoRef.current?.close();
        }

        setSelected(id);
        document.getElementById(`device-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const openIncidents = incidents.filter(i => ['open', 'acknowledged', 'escalated'].includes(i.status));
    const deviceIncidentCount = (deviceId: number) =>
        openIncidents.filter(i => i.device?.id === deviceId).length;

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

            {/* ── Col 1: Device list (1/5) ─────────────────────────── */}
            <div className="w-1/5 min-w-44 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        Devices <span className="text-gray-400 font-normal">({devices.length})</span>
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {devices.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-2xl mb-2">📡</p>
                            <p className="text-xs text-gray-400">No devices assigned.</p>
                            <a href="/shop" className="mt-2 inline-block text-xs text-blue-600 hover:underline">Browse Shop</a>
                        </div>
                    ) : devices.map(device => {
                        const alertCount = deviceIncidentCount(device.id);
                        return (
                            <button key={device.id} id={`device-${device.id}`}
                                onClick={() => selectDevice(device.id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selected === device.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`shrink-0 w-2 h-2 rounded-full ${STATUS_DOT[device.status] ?? 'bg-gray-400'}`} />
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate flex-1">{device.name}</span>
                                    {alertCount > 0 && (
                                        <span className="shrink-0 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                                            {alertCount}
                                        </span>
                                    )}
                                </div>
                                <div className="pl-4 text-xs text-gray-400 truncate">{device.imei}</div>
                                {device.battery_percent != null && (
                                    <div className={`pl-4 text-xs mt-0.5 ${device.battery_percent < 20 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                        🔋 {device.battery_percent}%
                                    </div>
                                )}
                                {device.last_lat == null && (
                                    <div className="pl-4 text-xs text-gray-300 mt-0.5">No location</div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Col 2: Map (3/5) ─────────────────────────────────── */}
            <div className="flex-[3] relative min-w-0">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center text-center p-6">
                        <div>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="text-sm text-gray-500">Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.</p>
                        </div>
                    </div>
                ) : (
                    <div ref={mapRef} className="w-full h-full" />
                )}

                {/* Legend */}
                {mapsReady && (
                    <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs space-y-1">
                        {Object.entries(STATUS_COLOR).map(([s, c]) => (
                            <div key={s} className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c }} />
                                <span className="capitalize text-gray-600 dark:text-gray-400">{s}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Col 3: Incidents (1/5) ───────────────────────────── */}
            <div className="w-1/5 min-w-44 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        Incidents
                        {openIncidents.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-medium">
                                {openIncidents.length}
                            </span>
                        )}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">Auto-resolve when device returns</p>
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
                                <span className={`shrink-0 w-2 h-2 rounded-full ${INCIDENT_STATUS_COLOR[incident.status] ?? 'bg-gray-400'}`} />
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low}`}>
                                    {incident.priority}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 capitalize mt-1">
                                {incident.event_type.replace(/_/g, ' ')}
                            </p>
                            {incident.device && (
                                <button
                                    onClick={() => selectDevice(incident.device!.id)}
                                    className="text-xs text-blue-600 hover:underline mt-0.5 block text-left truncate w-full">
                                    {incident.device.name}
                                </button>
                            )}
                            {incident.beat && (
                                <p className="text-xs text-gray-400 truncate">Beat: {incident.beat.name}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(incident.triggered_at).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
