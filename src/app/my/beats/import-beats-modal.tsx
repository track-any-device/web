'use client';

import { useState, useRef, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import type { LatLng } from '@/lib/api-client';

interface KmlBeat {
    name: string;
    coordinates: LatLng[];
}

interface ImportItem extends KmlBeat {
    selected: boolean;
    editingName: string;
}

interface Props {
    token: string;
    onClose: () => void;
    onImported: () => void;
}

// ── KML / KMZ parsers ─────────────────────────────────────────────────────────

function parseKmlBeats(kml: string): KmlBeat[] {
    const doc = new DOMParser().parseFromString(kml, 'text/xml');
    const results: KmlBeat[] = [];

    for (const pm of Array.from(doc.querySelectorAll('Placemark'))) {
        const name = pm.querySelector('name')?.textContent?.trim() || 'Unnamed Zone';
        const coordEl = pm.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
        if (!coordEl?.textContent) continue;

        const coords = coordEl.textContent.trim().split(/\s+/).flatMap(token => {
            const [lngStr, latStr] = token.split(',');
            const lat = parseFloat(latStr), lng = parseFloat(lngStr);
            return isNaN(lat) || isNaN(lng) ? [] : [{ lat, lng } as LatLng];
        });

        if (coords.length >= 3) results.push({ name, coordinates: coords });
    }

    if (results.length === 0) {
        const coordEl = doc.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
        if (coordEl?.textContent) {
            const coords = coordEl.textContent.trim().split(/\s+/).flatMap(token => {
                const [lngStr, latStr] = token.split(',');
                const lat = parseFloat(latStr), lng = parseFloat(lngStr);
                return isNaN(lat) || isNaN(lng) ? [] : [{ lat, lng } as LatLng];
            });
            if (coords.length >= 3) results.push({ name: 'Imported Beat', coordinates: coords });
        }
    }

    return results;
}

async function parseKmzBeats(file: File): Promise<KmlBeat[]> {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const kmlEntry = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith('.kml'));
    if (!kmlEntry) throw new Error('No .kml file found inside the .kmz archive.');
    return parseKmlBeats(await kmlEntry.async('string'));
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAPS_KEY     = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const PRESET_COLORS = ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#64748b'];

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function ImportBeatsModal({ token, onClose, onImported }: Props) {
    const fileRef    = useRef<HTMLInputElement>(null);
    const mapRef     = useRef<HTMLDivElement>(null);
    const gmapRef    = useRef<google.maps.Map | null>(null);
    const polysRef   = useRef<Map<number, google.maps.Polygon>>(new Map());
    const pendingRef = useRef<ImportItem[] | null>(null);    // items waiting for map init
    const itemListRef = useRef<HTMLDivElement>(null);

    const [items,      setItems]      = useState<ImportItem[] | null>(null);
    const [mapsReady,  setMapsReady]  = useState(false);
    const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
    const [parsing,    setParsing]    = useState(false);
    const [importing,  setImporting]  = useState(false);
    const [progress,   setProgress]   = useState<{ done: number; total: number } | null>(null);
    const [imported,   setImported]   = useState<string[]>([]);
    const [failed,     setFailed]     = useState<string[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    // ── Load Google Maps API ──────────────────────────────────────────────────
    useEffect(() => {
        if (!MAPS_KEY) return;
        if (typeof google !== 'undefined') { setMapsReady(true); return; }
        if (document.querySelector('script[data-gmaps]')) {
            // Script already injected — poll until ready
            const id = setInterval(() => {
                if (typeof google !== 'undefined') { setMapsReady(true); clearInterval(id); }
            }, 100);
            return () => clearInterval(id);
        }
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
        s.async = true;
        s.dataset.gmaps = '1';
        s.onload = () => setMapsReady(true);
        document.head.appendChild(s);
    }, []);

    // ── Init map once Maps API is ready ───────────────────────────────────────
    useEffect(() => {
        if (!mapsReady || !mapRef.current || gmapRef.current) return;
        gmapRef.current = new google.maps.Map(mapRef.current, {
            center:            { lat: 31.5204, lng: 74.3587 },
            zoom:              10,
            mapTypeId:         'roadmap',
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl:    false,
        });
        // Draw any items that arrived before the map was ready
        if (pendingRef.current) {
            drawPolygons(pendingRef.current);
            pendingRef.current = null;
        }
    }, [mapsReady]);

    // ── Focus map on selected beat ────────────────────────────────────────────
    useEffect(() => {
        if (focusedIdx === null || !gmapRef.current || !items) return;
        const map  = gmapRef.current;
        const item = items[focusedIdx];

        polysRef.current.forEach((p, i) => {
            const c = PRESET_COLORS[i % PRESET_COLORS.length];
            p.setOptions({ fillOpacity: 0.18, strokeWeight: 2, zIndex: 1, fillColor: c, strokeColor: c });
        });

        const poly = polysRef.current.get(focusedIdx);
        if (poly) {
            const c = PRESET_COLORS[focusedIdx % PRESET_COLORS.length];
            poly.setOptions({ fillOpacity: 0.45, strokeWeight: 3.5, zIndex: 10, fillColor: c, strokeColor: c });
        }

        if (item?.coordinates.length >= 3) {
            const b = new google.maps.LatLngBounds();
            item.coordinates.forEach(v => b.extend(v));
            map.panTo(b.getCenter());
            setTimeout(() => map.fitBounds(b, 60), 220);
        }

        // Scroll the list item into view
        const el = itemListRef.current?.querySelector(`[data-idx="${focusedIdx}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [focusedIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Draw / redraw polygons ────────────────────────────────────────────────
    function drawPolygons(newItems: ImportItem[]) {
        const map = gmapRef.current;
        if (!map) return;

        polysRef.current.forEach(p => p.setMap(null));
        polysRef.current.clear();

        const bounds = new google.maps.LatLngBounds();
        let hasBounds = false;

        newItems.forEach((item, idx) => {
            if (item.coordinates.length < 3) return;
            const color = PRESET_COLORS[idx % PRESET_COLORS.length];
            const poly  = new google.maps.Polygon({
                paths:       item.coordinates,
                fillColor:   color,
                fillOpacity: 0.18,
                strokeColor: color,
                strokeWeight: 2,
                map:         item.selected ? map : null,
            });
            poly.addListener('click', () => setFocusedIdx(idx));
            polysRef.current.set(idx, poly);
            item.coordinates.forEach(v => { bounds.extend(v); hasBounds = true; });
        });

        if (hasBounds) map.fitBounds(bounds, 40);
    }

    // ── File handler ──────────────────────────────────────────────────────────
    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setParsing(true);
        setParseError(null);
        setItems(null);
        setFocusedIdx(null);
        polysRef.current.forEach(p => p.setMap(null));
        polysRef.current.clear();

        try {
            const beats = file.name.toLowerCase().endsWith('.kmz')
                ? await parseKmzBeats(file)
                : parseKmlBeats(await file.text());

            if (beats.length === 0) {
                setParseError('No valid polygons found. Make sure the file contains at least one Placemark with a polygon.');
                return;
            }

            const newItems: ImportItem[] = beats.map((b, i) => ({
                ...b,
                selected:    true,
                editingName: b.name,
            }));

            setItems(newItems);

            if (gmapRef.current) {
                drawPolygons(newItems);
            } else {
                pendingRef.current = newItems;
            }
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Failed to read file.');
        } finally {
            setParsing(false);
            e.target.value = '';
        }
    }

    // ── List interaction ──────────────────────────────────────────────────────
    function toggleAll(checked: boolean) {
        setItems(prev => {
            const next = prev?.map(it => ({ ...it, selected: checked })) ?? null;
            if (gmapRef.current) {
                const map = gmapRef.current;
                polysRef.current.forEach((poly, idx) => {
                    poly.setMap(checked ? map : null);
                });
            }
            return next;
        });
    }

    function toggleItem(idx: number) {
        setItems(prev => {
            if (!prev) return null;
            const next = prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it);
            const poly = polysRef.current.get(idx);
            if (poly && gmapRef.current) {
                poly.setMap(next[idx].selected ? gmapRef.current : null);
            }
            return next;
        });
    }

    function renameItem(idx: number, name: string) {
        setItems(prev => prev?.map((it, i) => i === idx ? { ...it, editingName: name } : it) ?? null);
    }

    // ── Import ────────────────────────────────────────────────────────────────
    async function handleImport() {
        if (!items) return;
        const toImport = items.filter(it => it.selected && it.editingName.trim());
        if (toImport.length === 0) return;

        setImporting(true);
        setProgress({ done: 0, total: toImport.length });
        const ok: string[] = [], fail: string[] = [];
        const api = new ApiClient(token);

        for (let i = 0; i < toImport.length; i++) {
            const item = toImport[i];
            try {
                await api.createBeat({
                    name:           item.editingName.trim(),
                    geo_fence_type: 'polygon',
                    color:          PRESET_COLORS[items.indexOf(item) % PRESET_COLORS.length],
                    coordinates:    item.coordinates,
                });
                ok.push(item.editingName.trim());
            } catch {
                fail.push(item.editingName.trim());
            }
            setProgress({ done: i + 1, total: toImport.length });
        }

        setImported(ok);
        setFailed(fail);
        setImporting(false);
        if (ok.length > 0) onImported();
    }

    const allDone       = imported.length > 0 || failed.length > 0;
    const selectedCount = items?.filter(it => it.selected).length ?? 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col"
                style={{ height: 'min(85vh, 680px)' }}>

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Import KML / KMZ</h2>
                        {items && !allDone && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {items.length} zone{items.length !== 1 ? 's' : ''} found
                                {focusedIdx !== null && ` · viewing ${items[focusedIdx]?.editingName || 'zone'}`}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── Body: left list + right map ──────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left panel */}
                    <div className="w-72 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700">

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                            {/* File picker */}
                            {!allDone && (
                                <div>
                                    <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                        <input ref={fileRef} type="file" accept=".kml,.kmz" className="hidden" onChange={handleFile} />
                                        {parsing ? (
                                            <p className="text-sm text-gray-500">Parsing file…</p>
                                        ) : items ? (
                                            <>
                                                <svg className="w-5 h-5 text-green-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{items.length} zone{items.length !== 1 ? 's' : ''} loaded</p>
                                                <p className="text-[10px] text-blue-500 mt-0.5">Click to choose a different file</p>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                <p className="text-xs text-gray-500">Choose a .kml or .kmz file</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Multiple beats per file supported</p>
                                            </>
                                        )}
                                    </label>
                                    {parseError && <p className="mt-2 text-xs text-red-600">{parseError}</p>}
                                </div>
                            )}

                            {/* Beat list */}
                            {items && !allDone && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                            Zones to import
                                        </span>
                                        <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none">
                                            <input type="checkbox"
                                                checked={selectedCount === items.length && items.length > 0}
                                                onChange={e => toggleAll(e.target.checked)}
                                                className="rounded" />
                                            All
                                        </label>
                                    </div>

                                    <div ref={itemListRef} className="space-y-1.5">
                                        {items.map((item, idx) => (
                                            <div key={idx}
                                                data-idx={idx}
                                                onClick={() => setFocusedIdx(idx)}
                                                className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 cursor-pointer transition-all
                                                    ${focusedIdx === idx
                                                        ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20 shadow-sm'
                                                        : item.selected
                                                            ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                            : 'border-gray-100 dark:border-gray-800 opacity-40 hover:opacity-70'}`}>

                                                <input type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() => toggleItem(idx)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="rounded shrink-0" />

                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                                                    style={{ background: PRESET_COLORS[idx % PRESET_COLORS.length] }} />

                                                <input
                                                    type="text"
                                                    value={item.editingName}
                                                    onChange={e => renameItem(idx, e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder="Zone name"
                                                    className="flex-1 min-w-0 bg-transparent text-xs font-medium text-gray-900 dark:text-white focus:outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                                                />

                                                <span className="text-[10px] text-gray-400 shrink-0">
                                                    {item.coordinates.length}pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Progress */}
                            {importing && progress && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Importing…</span>
                                        <span>{progress.done} / {progress.total}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            {allDone && (
                                <div className="space-y-3">
                                    {imported.length > 0 && (
                                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
                                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                                {imported.length} beat{imported.length !== 1 ? 's' : ''} imported
                                            </p>
                                            <ul className="mt-1 space-y-0.5">
                                                {imported.map(n => <li key={n} className="text-xs text-green-600 dark:text-green-500">✓ {n}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {failed.length > 0 && (
                                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                                            <p className="text-sm font-medium text-red-700 dark:text-red-400">{failed.length} failed</p>
                                            <ul className="mt-1 space-y-0.5">
                                                {failed.map(n => <li key={n} className="text-xs text-red-600 dark:text-red-500">✗ {n}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer buttons */}
                        <div className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                            {allDone ? (
                                <button onClick={onClose}
                                    className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                                    Done
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={onClose}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleImport}
                                        disabled={!items || selectedCount === 0 || importing}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                                        {importing ? 'Importing…' : `Import ${selectedCount > 0 ? selectedCount : ''} Beat${selectedCount !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right panel: Map */}
                    <div className="flex-1 relative bg-gray-50 dark:bg-gray-800 rounded-br-2xl overflow-hidden">
                        <div ref={mapRef} className="absolute inset-0" />

                        {/* Overlay when map not available */}
                        {!MAPS_KEY && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                                <p className="text-3xl mb-3">🗺️</p>
                                <p className="text-sm text-gray-400">Map preview not available</p>
                                <p className="text-xs text-gray-400 mt-1">Set <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></p>
                            </div>
                        )}

                        {/* Overlay hint when map is ready but no file loaded */}
                        {MAPS_KEY && mapsReady && !items && !parsing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <p className="text-2xl mb-2">📂</p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Upload a KML or KMZ file</p>
                                    <p className="text-xs text-gray-400 mt-1">Beat polygons will appear on the map</p>
                                </div>
                            </div>
                        )}

                        {/* Hint to click a beat */}
                        {MAPS_KEY && items && !allDone && focusedIdx === null && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                                <div className="bg-black/60 text-white text-xs rounded-full px-3 py-1.5 whitespace-nowrap">
                                    Click a zone in the list or on the map to focus it
                                </div>
                            </div>
                        )}

                        {/* Focused beat label */}
                        {focusedIdx !== null && items && !allDone && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                                        style={{ background: PRESET_COLORS[focusedIdx % PRESET_COLORS.length] }} />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-white">
                                        {items[focusedIdx]?.editingName || 'Zone ' + (focusedIdx + 1)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {items[focusedIdx]?.coordinates.length} pts
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
