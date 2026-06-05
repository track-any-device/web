'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Beat } from '@/lib/api-client';

interface Props { beats: Beat[]; token: string }

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const STATUS_DOT: Record<string, string> = {
    active:   'bg-green-500',
    inactive: 'bg-gray-400',
    draft:    'bg-yellow-400',
};

export default function BeatsMapView({ beats }: Props) {
    const mapRef      = useRef<HTMLDivElement>(null);
    const gmapRef     = useRef<google.maps.Map | null>(null);
    const polysRef    = useRef<Map<number, google.maps.Polygon>>(new Map());
    const [selected,  setSelected]  = useState<number | null>(null);
    const [mapsReady, setMapsReady] = useState(false);

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

    // ── Init map & draw all beats ─────────────────────────────────────────
    useEffect(() => {
        if (!mapsReady || !mapRef.current) return;
        if (gmapRef.current) return; // already initialised

        const map = new google.maps.Map(mapRef.current, {
            center: { lat: 31.5204, lng: 74.3587 },
            zoom: 10,
            mapTypeId: 'roadmap',
            fullscreenControl: false,
            streetViewControl: false,
        });
        gmapRef.current = map;

        const bounds = new google.maps.LatLngBounds();
        let hasBounds = false;

        beats.forEach(beat => {
            if (!beat.coordinates?.length) return;

            const poly = new google.maps.Polygon({
                paths:          beat.coordinates,
                fillColor:      beat.color ?? '#2563eb',
                fillOpacity:    0.2,
                strokeColor:    beat.color ?? '#2563eb',
                strokeWeight:   2,
                map,
            });
            polysRef.current.set(beat.id, poly);

            poly.addListener('click', () => focusBeat(beat.id, map));

            beat.coordinates.forEach(v => { bounds.extend(v); hasBounds = true; });
        });

        if (hasBounds) map.fitBounds(bounds, 60);
    }, [mapsReady, beats]); // eslint-disable-line react-hooks/exhaustive-deps

    function focusBeat(id: number, map?: google.maps.Map) {
        const m = map ?? gmapRef.current;
        if (!m) return;

        // Reset all polygon styles
        polysRef.current.forEach((p, pid) => {
            const beat = beats.find(b => b.id === pid);
            p.setOptions({
                fillOpacity:  0.2,
                strokeWeight: 2,
                strokeColor:  beat?.color ?? '#2563eb',
                fillColor:    beat?.color ?? '#2563eb',
                zIndex:       1,
            });
        });

        // Highlight selected
        const poly = polysRef.current.get(id);
        if (poly) {
            poly.setOptions({ fillOpacity: 0.4, strokeWeight: 3, zIndex: 10 });
            const beat = beats.find(b => b.id === id);
            if (beat?.coordinates?.length) {
                const b = new google.maps.LatLngBounds();
                beat.coordinates.forEach(v => b.extend(v));
                m.fitBounds(b, 80);
            }
        }
        setSelected(id);

        // Scroll list item into view
        document.getElementById(`beat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

            {/* ── Left: beats list (1/5) ──────────────────────────────── */}
            <div className="w-1/5 min-w-44 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        Beats <span className="text-gray-400 font-normal">({beats.length})</span>
                    </span>
                    <Link href="/my/beats/create"
                        className="text-xs font-semibold text-white px-2 py-1 rounded"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                        + New
                    </Link>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {beats.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-2xl mb-2">📍</p>
                            <p className="text-xs text-gray-400">No beats yet.</p>
                            <Link href="/my/beats/create"
                                className="mt-3 inline-block text-xs text-blue-600 hover:underline">
                                Create one
                            </Link>
                        </div>
                    ) : beats.map(beat => (
                        <button
                            key={beat.id}
                            id={`beat-${beat.id}`}
                            onClick={() => focusBeat(beat.id)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${selected === beat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: beat.color ?? '#2563eb' }} />
                                <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{beat.name}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-4">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[beat.status] ?? 'bg-gray-400'}`} />
                                <span className="text-xs text-gray-400 capitalize">{beat.status}</span>
                                {beat.coordinates?.length > 0 && (
                                    <span className="text-xs text-gray-300">· {beat.coordinates.length} pts</span>
                                )}
                            </div>
                            <div className="pl-4 mt-1 flex gap-2">
                                <Link href={`/my/beats/${beat.id}`}
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:underline">
                                    Edit
                                </Link>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Right: map (4/5) ────────────────────────────────────── */}
            <div className="flex-1 relative">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center text-center p-6">
                        <div>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="text-sm text-gray-500">Google Maps API key not configured.</p>
                            <p className="text-xs text-gray-400 mt-1">Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Cloudflare Pages.</p>
                        </div>
                    </div>
                ) : (
                    <div ref={mapRef} className="w-full h-full" />
                )}

                {selected && (
                    <button
                        onClick={() => {
                            polysRef.current.forEach((p, pid) => {
                                const b = beats.find(x => x.id === pid);
                                p.setOptions({ fillOpacity: 0.2, strokeWeight: 2, strokeColor: b?.color ?? '#2563eb', fillColor: b?.color ?? '#2563eb', zIndex: 1 });
                            });
                            setSelected(null);
                            if (gmapRef.current && beats.length > 0) {
                                const bounds = new google.maps.LatLngBounds();
                                beats.forEach(b => b.coordinates?.forEach(v => bounds.extend(v)));
                                gmapRef.current.fitBounds(bounds, 60);
                            }
                        }}
                        className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
                        ← Show all
                    </button>
                )}
            </div>
        </div>
    );
}
