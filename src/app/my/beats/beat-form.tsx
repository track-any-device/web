'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { BeatDetail, LatLng } from '@/lib/api-client';

interface Props { token: string; beat?: BeatDetail }

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

// Pixels within which clicking near the first vertex auto-closes the polygon
const SNAP_PX = 20;


export default function BeatForm({ token, beat }: Props) {
    const router  = useRouter();
    const mapRef  = useRef<HTMLDivElement>(null);
    const gmap    = useRef<google.maps.Map | null>(null);
    const poly    = useRef<google.maps.Polygon | null>(null);
    const preview = useRef<google.maps.Polyline | null>(null);
    const markers = useRef<google.maps.Marker[]>([]);
    const clickListener    = useRef<google.maps.MapsEventListener | null>(null);
    const dblClickListener = useRef<google.maps.MapsEventListener | null>(null);
    // Timestamp of last dblclick — used to swallow the spurious click that fires just before it
    const lastDblClick     = useRef<number>(0);

    const [name,        setName]        = useState(beat?.name ?? '');
    const [description, setDescription] = useState(beat?.description ?? '');
    const [color,       setColor]       = useState(beat?.color ?? '#2563eb');
    const [coords,      setCoords]      = useState<LatLng[]>(beat?.coordinates ?? []);
    const [drawing,     setDrawing]     = useState(false);
    const [tempPts,     setTempPts]     = useState<LatLng[]>([]);
    const [mapsReady,   setMapsReady]   = useState(false);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);

    // Keep a ref of tempPts so event handlers always see the latest value
    const tempPtsRef = useRef<LatLng[]>([]);
    useEffect(() => { tempPtsRef.current = tempPts; }, [tempPts]);

    // ── Load Maps API ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof google !== 'undefined') { setMapsReady(true); return; }
        if (!MAPS_KEY) return;
        const s = document.createElement('script');
        s.src   = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
        s.async = true;
        s.onload = () => setMapsReady(true);
        document.head.appendChild(s);
    }, []);

    // ── Init map ──────────────────────────────────────────────────────────────
    const initMap = useCallback(() => {
        if (!mapRef.current || gmap.current) return;
        const center = coords.length > 0 ? coords[0] : { lat: 31.5204, lng: 74.3587 };
        const map = new google.maps.Map(mapRef.current, {
            center, zoom: coords.length > 0 ? 13 : 10,
            disableDoubleClickZoom: true,
        });
        gmap.current = map;
        if (coords.length > 0) renderPolygon(map, coords, color);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { if (mapsReady) initMap(); }, [mapsReady, initMap]);

    // ── Drawing mode ──────────────────────────────────────────────────────────
    useEffect(() => {
        const map = gmap.current;
        if (!map) return;

        clickListener.current    && google.maps.event.removeListener(clickListener.current);
        dblClickListener.current && google.maps.event.removeListener(dblClickListener.current);

        if (!drawing) {
            map.setOptions({ cursor: '' });
            return;
        }

        map.setOptions({ cursor: 'crosshair' });

        clickListener.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;

            // Ignore this click if it fired within 300 ms of the last dblclick
            // (Google Maps fires click → dblclick in quick succession; the click
            //  would add an unwanted extra vertex right before finishing the polygon)
            if (Date.now() - lastDblClick.current < 300) return;

            const pt      = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            const current = tempPtsRef.current;

            // Snap-to-first: if ≥ 3 points already and click is near the first vertex, close
            if (current.length >= 3 && map) {
                const first    = current[0];
                const proj     = map.getProjection();
                const zoom     = map.getZoom() ?? 10;
                const scale    = Math.pow(2, zoom);
                if (proj) {
                    const fp   = proj.fromLatLngToPoint(new google.maps.LatLng(first.lat, first.lng));
                    const cp   = proj.fromLatLngToPoint(new google.maps.LatLng(pt.lat, pt.lng));
                    if (fp && cp) {
                        const dx   = (fp.x - cp.x) * scale;
                        const dy   = (fp.y - cp.y) * scale;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < SNAP_PX) {
                            finishDrawing(current);
                            setTempPts([]);
                            return;
                        }
                    }
                }
            }

            setTempPts(prev => {
                const next = [...prev, pt];
                updatePreview(map, next, color);
                return next;
            });
        });

        dblClickListener.current = map.addListener('dblclick', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            lastDblClick.current = Date.now();  // record timestamp to suppress the preceding click
            const pts = tempPtsRef.current;
            if (pts.length >= 3) {
                finishDrawing(pts);
                setTempPts([]);
            }
        });

        return () => {
            clickListener.current    && google.maps.event.removeListener(clickListener.current);
            dblClickListener.current && google.maps.event.removeListener(dblClickListener.current);
        };
    }, [drawing, color]); // eslint-disable-line react-hooks/exhaustive-deps

    function updatePreview(map: google.maps.Map, pts: LatLng[], hex: string) {
        markers.current.forEach(m => m.setMap(null));
        markers.current = pts.map((pt, i) => new google.maps.Marker({
            position: pt, map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: i === 0 ? 7 : 5,
                fillColor: hex, fillOpacity: 1,
                strokeColor: '#fff', strokeWeight: 2,
            },
            zIndex: 10,
        }));

        preview.current?.setMap(null);
        if (pts.length >= 2) {
            // Close the preview line back to the first point to hint at snap
            const pathWithClose = pts.length >= 3 ? [...pts, pts[0]] : pts;
            preview.current = new google.maps.Polyline({
                path: pathWithClose, map,
                strokeColor: hex, strokeWeight: 2, strokeOpacity: 0.7,
            });
        }
    }

    function finishDrawing(pts: LatLng[]) {
        const map = gmap.current;
        if (!map || pts.length < 3) return;

        markers.current.forEach(m => m.setMap(null));
        markers.current = [];
        preview.current?.setMap(null);
        preview.current = null;

        renderPolygon(map, pts, color);
        setCoords(pts);
        setDrawing(false);
    }

    function renderPolygon(map: google.maps.Map, vertices: LatLng[], hex: string) {
        poly.current?.setMap(null);
        const p = new google.maps.Polygon({
            paths: vertices, map,
            fillColor: hex, fillOpacity: 0.25,
            strokeColor: hex, strokeWeight: 2, editable: true,
        });
        poly.current = p;

        const path = p.getPath();
        const sync = () => setCoords(path.getArray().map(ll => ({ lat: ll.lat(), lng: ll.lng() })));
        path.addListener('set_at', sync);
        path.addListener('insert_at', sync);
        path.addListener('remove_at', sync);

        const bounds = new google.maps.LatLngBounds();
        vertices.forEach(v => bounds.extend(v));
        map.fitBounds(bounds, 60);
    }

    function clearPolygon() {
        poly.current?.setMap(null); poly.current = null;
        preview.current?.setMap(null); preview.current = null;
        markers.current.forEach(m => m.setMap(null)); markers.current = [];
        setCoords([]); setTempPts([]); setDrawing(false);
    }

    function cancelDrawing() {
        markers.current.forEach(m => m.setMap(null)); markers.current = [];
        preview.current?.setMap(null); preview.current = null;
        setTempPts([]); setDrawing(false);
    }

    function handleColorChange(hex: string) {
        setColor(hex);
        if (poly.current) poly.current.setOptions({ fillColor: hex, strokeColor: hex });
        if (preview.current) preview.current.setOptions({ strokeColor: hex });
        markers.current.forEach((m, i) => m.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: i === 0 ? 7 : 5,
            fillColor: hex, fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 2,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!name.trim()) { setError('Name is required.'); return; }
        if (coords.length < 3) { setError('Draw a polygon with at least 3 points.'); return; }
        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || undefined,
                geo_fence_type: 'polygon' as const,
                color,
                coordinates: coords,
            };
            const res = await fetch(
                beat ? `${API_URL}/api/my/beats/${beat.id}` : `${API_URL}/api/my/beats`,
                {
                    method: beat ? 'PUT' : 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(payload),
                },
            );
            if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.message ?? `${res.status}`); }
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
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. North Zone" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input value={description} onChange={e => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional" />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zone colour</label>
                    <div className="flex items-center gap-3 flex-wrap">
                        <input type="color" value={color} onChange={e => handleColorChange(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5 bg-white" />
                        {['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#64748b'].map(hex => (
                            <button key={hex} type="button" onClick={() => handleColorChange(hex)}
                                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === hex ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                                style={{ background: hex }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Map */}
            <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Geofence polygon *
                        {coords.length > 0 && <span className="ml-2 text-xs text-green-600 font-normal">{coords.length} vertices</span>}
                        {drawing && tempPts.length > 0 && <span className="ml-2 text-xs text-orange-500 font-normal">drawing… {tempPts.length} pts</span>}
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                        {MAPS_KEY && !drawing && (
                            <button type="button" onClick={() => { if (coords.length > 0) clearPolygon(); setDrawing(true); }}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors">
                                {coords.length > 0 ? 'Redraw' : 'Draw'}
                            </button>
                        )}
                        {drawing && (
                            <>
                                <button type="button" onClick={() => finishDrawing(tempPts)} disabled={tempPts.length < 3}
                                    className="text-xs font-semibold text-white px-2 py-1 rounded bg-green-600 hover:bg-green-700 disabled:opacity-40 transition-colors">
                                    Done ({tempPts.length} pts)
                                </button>
                                <button type="button" onClick={cancelDrawing}
                                    className="text-xs font-medium text-gray-600 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </>
                        )}
                        {coords.length > 0 && !drawing && (
                            <button type="button" onClick={clearPolygon}
                                className="text-xs font-medium text-red-600 px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors">
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {!MAPS_KEY ? (
                    <div className="h-80 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-center p-6">
                        <div>
                            <p className="text-3xl mb-2">🗺️</p>
                            <p className="text-sm text-gray-400">Google Maps API key not configured.</p>
                            <p className="text-xs text-gray-400 mt-1">Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable map drawing.</p>
                        </div>
                    </div>
                ) : (
                    <div ref={mapRef} className={`h-80 rounded-xl border overflow-hidden ${drawing ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 dark:border-gray-700'}`} />
                )}

                {drawing && (
                    <p className="text-xs text-orange-600 mt-1">
                        Click to place vertices · Double-click or click near the first point to finish · Minimum 3 points
                    </p>
                )}
                {!drawing && coords.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Click <strong>Draw</strong> to place polygon vertices on the map.</p>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button type="submit" disabled={saving}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                    {saving ? 'Saving…' : beat ? 'Update Beat' : 'Create Beat'}
                </button>
                <a href="/my/devices" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</a>
            </div>
        </form>
    );
}
