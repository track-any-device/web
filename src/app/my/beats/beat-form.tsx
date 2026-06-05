'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { BeatDetail, LatLng } from '@/lib/api-client';

interface Props {
    token: string;
    beat?: BeatDetail;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

// ── KML parser (client-side, no server round-trip) ──────────────────────────
function parseKml(kml: string): LatLng[] {
    const doc = new DOMParser().parseFromString(kml, 'text/xml');
    const coordEl = doc.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
    if (!coordEl?.textContent) return [];

    return coordEl.textContent
        .trim()
        .split(/\s+/)
        .map(token => {
            const [lngStr, latStr] = token.split(',');
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            return { lat, lng };
        })
        .filter(p => !isNaN(p.lat) && !isNaN(p.lng));
}

// ── Component ────────────────────────────────────────────────────────────────
export default function BeatForm({ token, beat }: Props) {
    const router   = useRouter();
    const mapRef   = useRef<HTMLDivElement>(null);
    const gmapRef  = useRef<google.maps.Map | null>(null);
    const polyRef  = useRef<google.maps.Polygon | null>(null);
    const drawRef  = useRef<google.maps.drawing.DrawingManager | null>(null);

    const [name,        setName]        = useState(beat?.name ?? '');
    const [description, setDescription] = useState(beat?.description ?? '');
    const [color,       setColor]       = useState(beat?.color ?? '#2563eb');
    const [coords,      setCoords]      = useState<LatLng[]>(beat?.coordinates ?? []);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [mapsReady,   setMapsReady]   = useState(false);

    // ── Load Google Maps ──────────────────────────────────────────────────
    useEffect(() => {
        if (typeof google !== 'undefined') { setMapsReady(true); return; }
        if (!MAPS_KEY) { setMapsReady(false); return; }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=drawing`;
        script.async = true;
        script.onload = () => setMapsReady(true);
        document.head.appendChild(script);
    }, []);

    // ── Init map once ready ───────────────────────────────────────────────
    const initMap = useCallback(() => {
        if (!mapRef.current || gmapRef.current) return;

        const center = coords.length > 0
            ? { lat: coords[0].lat, lng: coords[0].lng }
            : { lat: 31.5204, lng: 74.3587 }; // default: Lahore

        const map = new google.maps.Map(mapRef.current, {
            center,
            zoom: coords.length > 0 ? 13 : 10,
            mapTypeId: 'roadmap',
        });
        gmapRef.current = map;

        // Show existing polygon if editing
        if (coords.length > 0) {
            renderPolygon(map, coords);
        }

        // Drawing manager for new polygons
        const dm = new google.maps.drawing.DrawingManager({
            drawingMode: coords.length === 0 ? google.maps.drawing.OverlayType.POLYGON : null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
                fillColor: color,
                fillOpacity: 0.25,
                strokeColor: color,
                strokeWeight: 2,
                editable: true,
            },
        });
        dm.setMap(map);
        drawRef.current = dm;

        google.maps.event.addListener(dm, 'polygoncomplete', (polygon: google.maps.Polygon) => {
            dm.setDrawingMode(null);
            polyRef.current?.setMap(null);
            polyRef.current = polygon;
            polygon.setEditable(true);

            const newCoords = extractCoords(polygon);
            setCoords(newCoords);

            google.maps.event.addListener(polygon.getPath(), 'set_at', () => setCoords(extractCoords(polygon)));
            google.maps.event.addListener(polygon.getPath(), 'insert_at', () => setCoords(extractCoords(polygon)));
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (mapsReady) initMap();
    }, [mapsReady, initMap]);

    function renderPolygon(map: google.maps.Map, vertices: LatLng[]) {
        polyRef.current?.setMap(null);
        const poly = new google.maps.Polygon({
            paths: vertices,
            fillColor: '#2563eb',
            fillOpacity: 0.25,
            strokeColor: '#2563eb',
            strokeWeight: 2,
            editable: true,
        });
        poly.setMap(map);
        polyRef.current = poly;

        google.maps.event.addListener(poly.getPath(), 'set_at', () => setCoords(extractCoords(poly)));
        google.maps.event.addListener(poly.getPath(), 'insert_at', () => setCoords(extractCoords(poly)));

        // Fit bounds
        const bounds = new google.maps.LatLngBounds();
        vertices.forEach(v => bounds.extend(v));
        map.fitBounds(bounds, 60);
    }

    function extractCoords(poly: google.maps.Polygon): LatLng[] {
        return poly.getPath().getArray().map(ll => ({ lat: ll.lat(), lng: ll.lng() }));
    }

    // ── KML import ────────────────────────────────────────────────────────
    function handleKml(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const parsed = parseKml(ev.target?.result as string);
            if (parsed.length < 3) {
                setError('KML file must contain a polygon with at least 3 points.');
                return;
            }
            setCoords(parsed);
            if (gmapRef.current) renderPolygon(gmapRef.current, parsed);
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function handleColorChange(hex: string) {
        setColor(hex);
        if (polyRef.current) {
            polyRef.current.setOptions({ fillColor: hex, strokeColor: hex });
        }
        if (drawRef.current) {
            drawRef.current.setOptions({ polygonOptions: { fillColor: hex, fillOpacity: 0.25, strokeColor: hex, strokeWeight: 2, editable: true } });
        }
    }

    function clearPolygon() {
        polyRef.current?.setMap(null);
        polyRef.current = null;
        setCoords([]);
        if (drawRef.current) {
            drawRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        }
    }

    // ── Save ──────────────────────────────────────────────────────────────
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (coords.length < 3) { setError('Draw a polygon on the map with at least 3 points.'); return; }
        if (!name.trim()) { setError('Name is required.'); return; }

        setSaving(true);
        try {
            const payload = { name: name.trim(), description: description.trim() || undefined, geo_fence_type: 'polygon' as const, color, coordinates: coords };
            const url     = beat ? `${API_URL}/api/my/beats/${beat.id}` : `${API_URL}/api/my/beats`;
            const method  = beat ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message ?? `${res.status}`);
            }

            const saved = await res.json();
            router.push(`/my/beats/${saved.id}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. North Zone"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional description"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone colour</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={color}
                            onChange={e => handleColorChange(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 bg-white dark:bg-gray-800"
                        />
                        <div className="flex flex-wrap gap-1.5">
                            {['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#64748b'].map(hex => (
                                <button key={hex} type="button"
                                    onClick={() => handleColorChange(hex)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === hex ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                                    style={{ background: hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Geofence polygon *
                        {coords.length > 0 && (
                            <span className="ml-2 text-xs text-green-600 font-normal">{coords.length} vertices</span>
                        )}
                    </label>
                    <div className="flex items-center gap-2">
                        {/* KML import */}
                        <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors">
                            Import KML
                            <input type="file" accept=".kml,.kmz" className="hidden" onChange={handleKml} />
                        </label>
                        {coords.length > 0 && (
                            <button type="button" onClick={clearPolygon}
                                className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors">
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {!MAPS_KEY ? (
                    <div className="h-80 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm text-gray-400 text-center p-4">
                        <div>
                            <p className="text-2xl mb-2">🗺️</p>
                            <p>Google Maps API key not configured.</p>
                            <p className="text-xs mt-1">Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable map drawing.</p>
                            <p className="text-xs mt-2">You can still import a KML file above.</p>
                        </div>
                    </div>
                ) : (
                    <div ref={mapRef} className="h-80 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" />
                )}
                {!mapsReady && MAPS_KEY && (
                    <p className="text-xs text-gray-400 mt-1">Loading map…</p>
                )}
                {coords.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Draw a polygon on the map or import a .kml file.</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button type="submit" disabled={saving}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                    {saving ? 'Saving…' : beat ? 'Update Beat' : 'Create Beat'}
                </button>
                <a href="/my/beats" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    Cancel
                </a>
            </div>
        </form>
    );
}
