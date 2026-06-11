'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Beat } from '@/lib/api-client';
import ImportBeatsModal from './import-beats-modal';

interface Props { beats: Beat[]; token: string; onImported: () => void; }

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const STATUS_DOT: Record<string, string> = {
    active:   'bg-green-500',
    inactive: 'bg-gray-400',
    draft:    'bg-yellow-400',
};

const STATUS_LABEL: Record<string, string> = {
    active:   'Active',
    inactive: 'Inactive',
    draft:    'Draft',
};

export default function BeatsMapView({ beats, token, onImported }: Props) {
    const mapRef      = useRef<HTMLDivElement>(null);
    const gmapRef     = useRef<google.maps.Map | null>(null);
    const polysRef    = useRef<Map<number, google.maps.Polygon>>(new Map());
    const [selected,      setSelected]      = useState<number | null>(null);
    const [mapsReady,     setMapsReady]     = useState(false);
    const [showImport,    setShowImport]    = useState(false);

    // ── Load Maps API ─────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof google !== 'undefined') { setMapsReady(true); return; }
        if (!MAPS_KEY) return;
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
        s.async = true;
        s.onload = () => setMapsReady(true);
        document.head.appendChild(s);
    }, []);

    // ── Init map + draw all beats ─────────────────────────────────────────
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

        const bounds = new google.maps.LatLngBounds();
        let hasBounds = false;

        beats.forEach(beat => {
            if (!beat.coordinates?.length) return;
            const poly = new google.maps.Polygon({
                paths: beat.coordinates,
                fillColor: beat.color ?? '#2563eb',
                fillOpacity: 0.2,
                strokeColor: beat.color ?? '#2563eb',
                strokeWeight: 2,
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

        // Reset all polygons
        polysRef.current.forEach((p, pid) => {
            const beat = beats.find(b => b.id === pid);
            p.setOptions({
                fillOpacity: 0.2, strokeWeight: 2,
                strokeColor: beat?.color ?? '#2563eb',
                fillColor:   beat?.color ?? '#2563eb',
                zIndex: 1,
            });
        });

        // Highlight selected polygon
        const poly = polysRef.current.get(id);
        if (poly) {
            poly.setOptions({ fillOpacity: 0.4, strokeWeight: 3, zIndex: 10 });
        }

        const beat = beats.find(b => b.id === id);
        if (beat?.coordinates?.length) {
            const b = new google.maps.LatLngBounds();
            beat.coordinates.forEach(v => b.extend(v));
            const center = b.getCenter();

            // Animated move: pan to centroid first, then fit bounds
            m.panTo(center);
            setTimeout(() => m.fitBounds(b, 80), 300);
        }

        setSelected(id);
        document.getElementById(`beat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function showAll() {
        polysRef.current.forEach((p, pid) => {
            const b = beats.find(x => x.id === pid);
            p.setOptions({ fillOpacity: 0.2, strokeWeight: 2, strokeColor: b?.color ?? '#2563eb', fillColor: b?.color ?? '#2563eb', zIndex: 1 });
        });
        setSelected(null);
        const m = gmapRef.current;
        if (m && beats.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            beats.forEach(b => b.coordinates?.forEach(v => bounds.extend(v)));
            m.fitBounds(bounds, 60);
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

            {/* ── Beat list ─────────────────────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            My Beats <span className="text-gray-400 font-normal text-xs">({beats.length})</span>
                        </span>
                        <Link href="/my/beats/create"
                            className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                            + New
                        </Link>
                    </div>
                    <button
                        onClick={() => setShowImport(true)}
                        className="w-full text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 rounded-lg px-2.5 py-1.5 transition-colors flex items-center justify-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import KML / KMZ
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {beats.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-3xl mb-2">📍</p>
                            <p className="text-xs text-gray-400 mb-3">No beats yet.</p>
                            <Link href="/my/beats/create"
                                className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg inline-block"
                                style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                                Create your first beat
                            </Link>
                        </div>
                    ) : beats.map(beat => (
                        <button key={beat.id} id={`beat-${beat.id}`}
                            onClick={() => focusBeat(beat.id)}
                            className={`w-full text-left px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 transition-all
                                ${selected === beat.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                                    : 'border-l-2 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>

                            {/* Color swatch + name */}
                            <div className="flex items-start gap-2.5">
                                <span className="shrink-0 w-3 h-3 rounded-sm mt-0.5"
                                    style={{ background: beat.color ?? '#2563eb' }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
                                        {beat.name}
                                    </p>

                                    {/* Status + points */}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[beat.status] ?? 'bg-gray-400'}`} />
                                        <span className="text-[10px] text-gray-400">{STATUS_LABEL[beat.status] ?? beat.status}</span>
                                        {beat.coordinates?.length > 0 && (
                                            <span className="text-[10px] text-gray-300 ml-auto">{beat.coordinates.length} pts</span>
                                        )}
                                    </div>

                                    {beat.description && (
                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{beat.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Edit link */}
                            <div className="mt-1.5 pl-5">
                                <Link href={`/my/beats/${beat.id}`}
                                    onClick={e => e.stopPropagation()}
                                    className="text-[10px] text-blue-600 hover:underline font-medium">
                                    Edit beat →
                                </Link>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Map ──────────────────────────────────────────────── */}
            <div className="flex-1 relative">
                {!MAPS_KEY ? (
                    <div className="h-full flex items-center justify-center text-center p-8">
                        <div>
                            <p className="text-4xl mb-3">🗺️</p>
                            <p className="text-sm text-gray-500">Google Maps API key not configured.</p>
                            <p className="text-xs text-gray-400 mt-1">Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Cloudflare Pages.</p>
                        </div>
                    </div>
                ) : <div ref={mapRef} className="w-full h-full" />}

                {selected !== null && (
                    <button onClick={showAll}
                        className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
                        ← Show all beats
                    </button>
                )}
            </div>

            {showImport && (
                <ImportBeatsModal
                    token={token}
                    onClose={() => setShowImport(false)}
                    onImported={() => { setShowImport(false); onImported(); }}
                />
            )}
        </div>
    );
}
