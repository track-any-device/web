'use client';

import { useState, useRef } from 'react';
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

    const placemarks = Array.from(doc.querySelectorAll('Placemark'));

    for (const pm of placemarks) {
        const name = pm.querySelector('name')?.textContent?.trim() || 'Unnamed Zone';
        const coordEl = pm.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
        if (!coordEl?.textContent) continue;

        const coords = coordEl.textContent.trim().split(/\s+/).flatMap(token => {
            const [lngStr, latStr] = token.split(',');
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            return isNaN(lat) || isNaN(lng) ? [] : [{ lat, lng } as LatLng];
        });

        if (coords.length >= 3) results.push({ name, coordinates: coords });
    }

    // Fallback: bare polygon with no Placemark wrapper
    if (results.length === 0) {
        const coordEl = doc.querySelector('Polygon coordinates, LinearRing coordinates, coordinates');
        if (coordEl?.textContent) {
            const coords = coordEl.textContent.trim().split(/\s+/).flatMap(token => {
                const [lngStr, latStr] = token.split(',');
                const lat = parseFloat(latStr);
                const lng = parseFloat(lngStr);
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
    const kmlText = await kmlEntry.async('string');
    return parseKmlBeats(kmlText);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const PRESET_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#64748b'];

export default function ImportBeatsModal({ token, onClose, onImported }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);

    const [items,     setItems]     = useState<ImportItem[] | null>(null);
    const [parsing,   setParsing]   = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress,  setProgress]  = useState<{ done: number; total: number } | null>(null);
    const [imported,  setImported]  = useState<string[]>([]);
    const [failed,    setFailed]    = useState<string[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setParsing(true);
        setParseError(null);
        setItems(null);

        try {
            const beats = file.name.toLowerCase().endsWith('.kmz')
                ? await parseKmzBeats(file)
                : parseKmlBeats(await file.text());

            if (beats.length === 0) {
                setParseError('No valid polygons found in the file. Make sure it contains at least one Placemark with a polygon.');
                return;
            }

            setItems(beats.map((b, i) => ({
                ...b,
                selected: true,
                editingName: b.name,
                color: PRESET_COLORS[i % PRESET_COLORS.length],
            })));
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Failed to read file.');
        } finally {
            setParsing(false);
            e.target.value = '';
        }
    }

    function toggleAll(checked: boolean) {
        setItems(prev => prev?.map(it => ({ ...it, selected: checked })) ?? null);
    }

    function toggleItem(idx: number) {
        setItems(prev => prev?.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it) ?? null);
    }

    function renameItem(idx: number, name: string) {
        setItems(prev => prev?.map((it, i) => i === idx ? { ...it, editingName: name } : it) ?? null);
    }

    async function handleImport() {
        if (!items) return;
        const toImport = items.filter(it => it.selected && it.editingName.trim());
        if (toImport.length === 0) return;

        setImporting(true);
        setProgress({ done: 0, total: toImport.length });
        const ok: string[] = [];
        const fail: string[] = [];
        const api = new ApiClient(token);

        for (let i = 0; i < toImport.length; i++) {
            const item = toImport[i];
            try {
                await api.createBeat({
                    name: item.editingName.trim(),
                    geo_fence_type: 'polygon',
                    color: PRESET_COLORS[i % PRESET_COLORS.length],
                    coordinates: item.coordinates,
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

    const allDone = imported.length > 0 || failed.length > 0;
    const selectedCount = items?.filter(it => it.selected).length ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Import KML / KMZ</h2>
                        {items && !allDone && (
                            <p className="text-xs text-gray-500 mt-0.5">{items.length} zone{items.length !== 1 ? 's' : ''} found</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* File picker — always visible until done */}
                    {!allDone && (
                        <div>
                            <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                <input ref={fileRef} type="file" accept=".kml,.kmz" className="hidden" onChange={handleFile} />
                                {parsing ? (
                                    <p className="text-sm text-gray-500">Parsing file…</p>
                                ) : items ? (
                                    <>
                                        <svg className="w-6 h-6 text-green-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{items.length} zone{items.length !== 1 ? 's' : ''} ready</p>
                                        <p className="text-xs text-blue-500 mt-0.5">Click to choose a different file</p>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-7 h-7 text-gray-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <p className="text-sm text-gray-500">Choose a .kml or .kmz file</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Multiple beats per file supported</p>
                                    </>
                                )}
                            </label>
                            {parseError && (
                                <p className="mt-2 text-xs text-red-600">{parseError}</p>
                            )}
                        </div>
                    )}

                    {/* Beat list */}
                    {items && !allDone && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Review zones to import
                                </span>
                                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                                    <input type="checkbox"
                                        checked={selectedCount === items.length}
                                        onChange={e => toggleAll(e.target.checked)}
                                        className="rounded" />
                                    Select all
                                </label>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {items.map((item, idx) => (
                                    <div key={idx}
                                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors
                                            ${item.selected
                                                ? 'border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-900/10'
                                                : 'border-gray-200 dark:border-gray-700 opacity-50'}`}>
                                        <input type="checkbox"
                                            checked={item.selected}
                                            onChange={() => toggleItem(idx)}
                                            className="rounded shrink-0" />
                                        <span className="w-3 h-3 rounded-sm shrink-0"
                                            style={{ background: PRESET_COLORS[idx % PRESET_COLORS.length] }} />
                                        <input
                                            type="text"
                                            value={item.editingName}
                                            onChange={e => renameItem(idx, e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                                        />
                                        <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                                            {item.coordinates.length} pts
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
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                                />
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
                                        {imported.map(n => (
                                            <li key={n} className="text-xs text-green-600 dark:text-green-500">✓ {n}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {failed.length > 0 && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                        {failed.length} failed
                                    </p>
                                    <ul className="mt-1 space-y-0.5">
                                        {failed.map(n => (
                                            <li key={n} className="text-xs text-red-600 dark:text-red-500">✗ {n}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                    {allDone ? (
                        <button onClick={onClose}
                            className="ml-auto px-5 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                            Done
                        </button>
                    ) : (
                        <>
                            <button onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!items || selectedCount === 0 || importing}
                                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                                {importing ? 'Importing…' : `Import ${selectedCount > 0 ? selectedCount : ''} Beat${selectedCount !== 1 ? 's' : ''}`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
