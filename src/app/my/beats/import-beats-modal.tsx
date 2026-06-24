'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Check, Upload, FolderOpen, MapPin } from 'lucide-react';
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

function extractKmlName(pm: Element): string {
    // 1. Standard <name> element
    const direct = pm.querySelector(':scope > name')?.textContent?.trim();
    if (direct) return direct;

    // 2. Extended data — <Data name="..."><value> (common in QGIS / ArcGIS exports)
    for (const data of Array.from(pm.querySelectorAll('ExtendedData Data'))) {
        const key = data.getAttribute('name')?.toLowerCase() ?? '';
        if (key === 'name' || key === 'label' || key === 'title') {
            const val = data.querySelector('value')?.textContent?.trim();
            if (val) return val;
        }
    }

    // 3. Schema-based extended data — <SimpleData name="Name">
    for (const sd of Array.from(pm.querySelectorAll('ExtendedData SchemaData SimpleData'))) {
        const key = sd.getAttribute('name')?.toLowerCase() ?? '';
        if (key === 'name' || key === 'label' || key === 'title') {
            const val = sd.textContent?.trim();
            if (val) return val;
        }
    }

    // 4. First non-empty <SimpleData> value as last resort
    const anySimple = pm.querySelector('ExtendedData SimpleData')?.textContent?.trim();
    if (anySimple) return anySimple;

    // 5. Parent <Folder><name> as final fallback
    const folderName = pm.closest('Folder')?.querySelector(':scope > name')?.textContent?.trim();
    if (folderName) return folderName;

    return 'Unnamed Zone';
}

function parseCoords(text: string): LatLng[] {
    return text.trim().split(/\s+/).flatMap(token => {
        const [lngStr, latStr] = token.split(',');
        const lat = parseFloat(latStr), lng = parseFloat(lngStr);
        return isNaN(lat) || isNaN(lng) ? [] : [{ lat, lng } as LatLng];
    });
}

function parseKmlBeats(kml: string): KmlBeat[] {
    const doc = new DOMParser().parseFromString(kml, 'text/xml');
    const results: KmlBeat[] = [];

    for (const pm of Array.from(doc.querySelectorAll('Placemark'))) {
        const name    = extractKmlName(pm);
        const coordEl = pm.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
        if (!coordEl?.textContent) continue;

        const coords = parseCoords(coordEl.textContent);
        if (coords.length >= 3) results.push({ name, coordinates: coords });
    }

    // Fallback: bare polygon with no Placemark wrapper
    if (results.length === 0) {
        const coordEl = doc.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
        if (coordEl?.textContent) {
            const coords = parseCoords(coordEl.textContent);
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
const PRESET_COLORS = ['#01411C','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#64748b'];

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
            const isKmz  = file.name.toLowerCase().endsWith('.kmz');
            const kmlText = isKmz ? null : await file.text();
            const beats   = isKmz ? await parseKmzBeats(file) : parseKmlBeats(kmlText!);

            console.log('[KML import] file:', file.name, '| beats found:', beats.length);
            console.log('[KML import] parsed beats:', beats.map(b => ({ name: b.name, points: b.coordinates.length })));
            if (kmlText) {
                const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
                Array.from(doc.querySelectorAll('Placemark')).forEach((pm, i) => {
                    console.log(`[KML import] Placemark[${i}] raw:`, pm.outerHTML);
                });
            }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,16,8,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="tad-card w-full max-w-5xl flex flex-col"
                style={{ height: 'min(85vh, 680px)', boxShadow: 'var(--shadow-xl)' }}>

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="tad-card__header shrink-0">
                    <div>
                        <h2 className="tad-card__title">Import KML / KMZ</h2>
                        {items && !allDone && (
                            <p className="mt-0.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {items.length} zone{items.length !== 1 ? 's' : ''} found
                                {focusedIdx !== null && ` · viewing ${items[focusedIdx]?.editingName || 'zone'}`}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="tad-iconbtn tad-iconbtn--sm" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Body: left list + right map (stacks vertically on mobile) ── */}
                <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

                    {/* Left panel */}
                    <div className="flex max-h-[45%] shrink-0 flex-col border-b md:max-h-none md:w-72 md:border-b-0 md:border-r"
                        style={{ borderColor: 'var(--border)' }}>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                            {/* File picker */}
                            {!allDone && (
                                <div>
                                    <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer transition-colors"
                                        style={{ borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-strong)' }}>
                                        <input ref={fileRef} type="file" accept=".kml,.kmz" className="hidden" onChange={handleFile} />
                                        {parsing ? (
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Parsing file…</p>
                                        ) : items ? (
                                            <>
                                                <Check className="w-5 h-5 mb-1" style={{ color: 'var(--success)' }} />
                                                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>{items.length} zone{items.length !== 1 ? 's' : ''} loaded</p>
                                                <p className="mt-0.5" style={{ fontSize: 'var(--text-2xs)', color: 'var(--brand)' }}>Click to choose a different file</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 mb-1" style={{ color: 'var(--text-subtle)' }} />
                                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Choose a .kml or .kmz file</p>
                                                <p className="mt-0.5" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>Multiple beats per file supported</p>
                                            </>
                                        )}
                                    </label>
                                    {parseError && <p className="mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{parseError}</p>}
                                </div>
                            )}

                            {/* Beat list */}
                            {items && !allDone && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="uppercase" style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-muted)' }}>
                                            Zones to import
                                        </span>
                                        <label className="flex items-center gap-1.5 cursor-pointer select-none" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                            <input type="checkbox"
                                                checked={selectedCount === items.length && items.length > 0}
                                                onChange={e => toggleAll(e.target.checked)}
                                                className="rounded"
                                                style={{ accentColor: 'var(--brand)' }} />
                                            All
                                        </label>
                                    </div>

                                    <div ref={itemListRef} className="space-y-1.5">
                                        {items.map((item, idx) => (
                                            <div key={idx}
                                                data-idx={idx}
                                                onClick={() => setFocusedIdx(idx)}
                                                className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer transition-all"
                                                style={{
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid',
                                                    borderColor: focusedIdx === idx ? 'var(--brand)' : item.selected ? 'var(--border)' : 'var(--border-subtle)',
                                                    background: focusedIdx === idx ? 'var(--brand-subtle)' : 'transparent',
                                                    boxShadow: focusedIdx === idx ? 'var(--shadow-xs)' : undefined,
                                                    opacity: item.selected ? 1 : 0.4,
                                                }}>

                                                <input type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() => toggleItem(idx)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="rounded shrink-0"
                                                    style={{ accentColor: 'var(--brand)' }} />

                                                <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                                                    style={{ background: PRESET_COLORS[idx % PRESET_COLORS.length] }} />

                                                <input
                                                    type="text"
                                                    value={item.editingName}
                                                    onChange={e => renameItem(idx, e.target.value)}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder="Zone name"
                                                    className="flex-1 min-w-0 bg-transparent focus:outline-none transition-colors"
                                                    style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text)', borderBottom: '1px solid transparent' }}
                                                />

                                                <span className="shrink-0" style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                                                    {item.coordinates.length}pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            {allDone && (
                                <div className="space-y-3">
                                    {imported.length > 0 && (
                                        <div className="rounded-lg px-4 py-3"
                                            style={{ background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)' }}>
                                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--success)' }}>
                                                {imported.length} beat{imported.length !== 1 ? 's' : ''} imported
                                            </p>
                                            <ul className="mt-1 space-y-0.5">
                                                {imported.map(n => <li key={n} className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}><Check className="w-3 h-3 shrink-0" /> {n}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {failed.length > 0 && (
                                        <div className="rounded-lg px-4 py-3"
                                            style={{ background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--danger)' }}>{failed.length} failed</p>
                                            <ul className="mt-1 space-y-0.5">
                                                {failed.map(n => <li key={n} className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}><X className="w-3 h-3 shrink-0" /> {n}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 px-4 py-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                            {/* Progress bar — always visible while importing */}
                            {importing && progress && (
                                <div>
                                    <div className="flex justify-between mb-1" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                        <span>Importing beat {progress.done + (progress.done < progress.total ? 1 : 0)} of {progress.total}…</span>
                                        <span style={{ fontWeight: 'var(--weight-medium)', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>{Math.round((progress.done / progress.total) * 100)}%</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
                                        <div className="h-full rounded-full transition-all duration-200"
                                            style={{ width: `${(progress.done / progress.total) * 100}%`, background: 'var(--brand)' }} />
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            {allDone ? (
                                <button onClick={onClose} className="tad-btn tad-btn--primary tad-btn--block">
                                    Done
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={onClose} disabled={importing} className="tad-btn tad-btn--secondary tad-btn--sm">
                                        Cancel
                                    </button>
                                    <button onClick={handleImport}
                                        disabled={!items || selectedCount === 0 || importing}
                                        className="tad-btn tad-btn--primary tad-btn--sm flex-1">
                                        {importing ? 'Importing…' : `Import ${selectedCount > 0 ? selectedCount : ''} beat${selectedCount !== 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right panel: Map */}
                    <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--bg-sunken)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                        <div ref={mapRef} className="absolute inset-0" />

                        {/* Overlay when map not available */}
                        {!MAPS_KEY && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none gap-2">
                                <MapPin className="w-9 h-9" style={{ color: 'var(--text-subtle)' }} />
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Map preview not available</p>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></p>
                            </div>
                        )}

                        {/* Overlay hint when map is ready but no file loaded */}
                        {MAPS_KEY && mapsReady && !items && !parsing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                                <div className="backdrop-blur-sm px-6 py-5 flex flex-col items-center gap-2"
                                    style={{ background: 'color-mix(in srgb, var(--surface) 82%, transparent)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                    <FolderOpen className="w-7 h-7" style={{ color: 'var(--text-subtle)' }} />
                                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Upload a KML or KMZ file</p>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Beat polygons will appear on the map</p>
                                </div>
                            </div>
                        )}

                        {/* Hint to click a beat */}
                        {MAPS_KEY && items && !allDone && focusedIdx === null && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                                <div className="rounded-full px-3 py-1.5 whitespace-nowrap"
                                    style={{ background: 'color-mix(in srgb, var(--sand-900) 65%, transparent)', color: '#fff', fontSize: 'var(--text-xs)' }}>
                                    Click a zone in the list or on the map to focus it
                                </div>
                            </div>
                        )}

                        {/* Focused beat label */}
                        {focusedIdx !== null && items && !allDone && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                                <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
                                    style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                                    <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                                        style={{ background: PRESET_COLORS[focusedIdx % PRESET_COLORS.length] }} />
                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>
                                        {items[focusedIdx]?.editingName || 'Zone ' + (focusedIdx + 1)}
                                    </span>
                                    <span style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
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
