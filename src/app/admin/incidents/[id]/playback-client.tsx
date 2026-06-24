'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, MapPin, Route } from 'lucide-react';
import { Card } from '@/components/ui';
import type { AdminIncidentLocation } from '../incidents-types';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Whole archived track replays in roughly this wall-clock time (long incidents are
// compressed so they're watchable; short ones are slowed to TRACK_MIN_MS so they
// aren't instant). Driven by `at` timestamps, so pauses in the data show as pauses.
const TARGET_PLAYBACK_MS = 18_000;
const TRACK_MIN_MS = 4_000;

type Pt = { lat: number; lng: number; t: number; speed: number | null };

function fmtClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtTime(epoch: number): string {
  const d = new Date(epoch);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function PlaybackCard({ locations }: { locations: AdminIncidentLocation[] }) {
  // Normalise to plottable points with epoch timestamps (oldest -> newest is preserved).
  const points = useMemo<Pt[]>(
    () =>
      locations
        .filter((p) => p.lat != null && p.lng != null && !Number.isNaN(Number(p.lat)) && !Number.isNaN(Number(p.lng)))
        .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), t: new Date(p.at).getTime(), speed: p.speed }))
        .filter((p) => !Number.isNaN(p.t)),
    [locations],
  );

  const hasTrack = points.length >= 2;

  // Track-time domain. If all timestamps collapse (single instant), synthesise an even
  // spacing by index so playback still advances.
  const { t0, span, evenlySpaced } = useMemo(() => {
    if (points.length < 2) return { t0: 0, span: 0, evenlySpaced: false };
    const first = points[0].t;
    const last = points[points.length - 1].t;
    const realSpan = last - first;
    if (realSpan <= 0) {
      // map index -> ms so the scrubber covers the whole set
      return { t0: 0, span: points.length - 1, evenlySpaced: true };
    }
    return { t0: first, span: realSpan, evenlySpaced: false };
  }, [points]);

  // Playhead is measured in track-ms within [0, span]. speedFactor converts wall-clock
  // ms (from rAF) into track-ms so the whole span fits TARGET_PLAYBACK_MS (>= TRACK_MIN_MS).
  const speedFactor = useMemo(() => {
    if (span <= 0) return 0;
    const duration = Math.max(TRACK_MIN_MS, Math.min(TARGET_PLAYBACK_MS, span));
    return span / duration; // track-ms per wall-clock-ms
  }, [span]);

  const [head, setHead] = useState(0); // track-ms
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Position along the track at a given track-time (linear interpolation between the
  // two bracketing points).
  const positionAt = useCallback(
    (trackMs: number): { lat: number; lng: number; speed: number | null } | null => {
      if (points.length === 0) return null;
      if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng, speed: points[0].speed };

      if (evenlySpaced) {
        const idx = Math.max(0, Math.min(points.length - 1, trackMs));
        const lo = Math.floor(idx);
        const hi = Math.min(points.length - 1, lo + 1);
        const f = idx - lo;
        const a = points[lo];
        const b = points[hi];
        return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f, speed: a.speed };
      }

      const target = t0 + Math.max(0, Math.min(span, trackMs));
      // find the segment [a,b] with a.t <= target <= b.t
      let hi = 1;
      while (hi < points.length - 1 && points[hi].t < target) hi++;
      const a = points[hi - 1];
      const b = points[hi];
      const segSpan = b.t - a.t || 1;
      const f = Math.max(0, Math.min(1, (target - a.t) / segSpan));
      return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f, speed: f < 0.5 ? a.speed : b.speed };
    },
    [points, t0, span, evenlySpaced],
  );

  // rAF loop — advances the playhead while playing; auto-stops at the end.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setHead((prev) => {
        const next = prev + dt * speedFactor;
        if (next >= span) { setPlaying(false); return span; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [playing, speedFactor, span]);

  function togglePlay() {
    if (!hasTrack) return;
    // Restart from the beginning if we're parked at the end.
    if (head >= span) setHead(0);
    setPlaying((p) => !p);
  }

  function scrub(value: number) {
    setPlaying(false);
    setHead(value);
  }

  // ── Map wiring ──────────────────────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null);
  const gmapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<{ position?: google.maps.LatLngLiteral; setMap: (m: google.maps.Map | null) => void } | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const [ready, setReady] = useState(false);

  // Load the Maps script once — shares the data-tad-maps dedup guard with /my.
  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps) { setReady(true); return; }
    if (!MAPS_KEY) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-tad-maps]');
    if (existing) { existing.addEventListener('load', () => setReady(true)); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=marker`;
    s.async = true;
    s.dataset.tadMaps = '1';
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  // Init the map + draw the full polyline, fit to the track. Create the moving marker.
  useEffect(() => {
    if (!ready || !mapRef.current || points.length === 0) return;
    const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));

    if (!gmapRef.current) {
      gmapRef.current = new google.maps.Map(mapRef.current, {
        center: path[0],
        zoom: 15,
        mapId: 'admin-incident-playback-map',
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
    }
    const map = gmapRef.current;

    lineRef.current?.setMap(null);
    if (path.length >= 2) {
      lineRef.current = new google.maps.Polyline({
        path, map, geodesic: true, strokeColor: '#01411C', strokeOpacity: 0.85, strokeWeight: 3,
      });
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 56);
    } else {
      map.setCenter(path[0]);
      map.setZoom(16);
    }

    // Moving marker (brand-coloured dot with a soft ring).
    markerRef.current?.setMap(null);
    const dot = document.createElement('div');
    dot.style.cssText = 'width:16px;height:16px;border-radius:50%;background:var(--brand,#01411C);border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AdvMarker = (google.maps as any).marker?.AdvancedMarkerElement;
    if (AdvMarker) {
      markerRef.current = new AdvMarker({ map, position: path[0], content: dot });
    } else {
      markerRef.current = new google.maps.Marker({
        position: path[0], map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#01411C', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      }) as unknown as { setMap: (m: google.maps.Map | null) => void };
    }

    return () => { lineRef.current?.setMap(null); markerRef.current?.setMap(null); };
  }, [ready, points]);

  // Move the marker as the playhead changes.
  useEffect(() => {
    if (!markerRef.current) return;
    const pos = positionAt(head);
    if (!pos) return;
    const m = markerRef.current as { position?: google.maps.LatLngLiteral; setPosition?: (p: google.maps.LatLngLiteral) => void };
    if (typeof m.setPosition === 'function') m.setPosition({ lat: pos.lat, lng: pos.lng });
    else m.position = { lat: pos.lat, lng: pos.lng };
  }, [head, positionAt]);

  const current = positionAt(head);
  const currentEpoch = evenlySpaced
    ? points[Math.min(points.length - 1, Math.round(head))]?.t ?? 0
    : t0 + head;
  const sliderMax = span > 0 ? span : 1;

  return (
    <Card title="Track playback" flushBody>
      <div style={{ height: 360, position: 'relative', borderRadius: '0 0 0 0', overflow: 'hidden' }}>
        {!MAPS_KEY ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg-sunken)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
            </p>
          </div>
        ) : points.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg-sunken)', gap: 10 }}>
            <Route style={{ width: 30, height: 30, color: 'var(--text-subtle)' }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.5 }}>
              No archived track for this incident — locations are only captured while an incident is open.
            </p>
          </div>
        ) : <div ref={mapRef} style={{ width: '100%', height: '100%' }} />}
      </div>

      {/* Scrubber + play/pause — only when there's an interpolatable track */}
      {MAPS_KEY && hasTrack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="tad-btn tad-btn--secondary tad-btn--sm"
            style={{ width: 38, height: 38, padding: 0, justifyContent: 'center', flex: 'none' }}
          >
            {playing ? <Pause width={16} height={16} /> : <Play width={16} height={16} />}
          </button>

          <input
            type="range"
            min={0}
            max={sliderMax}
            step={sliderMax / 1000}
            value={head}
            onChange={(e) => scrub(Number(e.target.value))}
            aria-label="Track position"
            style={{ flex: 1, accentColor: 'var(--brand)', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 96 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {evenlySpaced ? `${Math.min(points.length, Math.round(head) + 1)} / ${points.length}` : `${fmtClock(head)} / ${fmtClock(span)}`}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
              {fmtTime(currentEpoch)}
            </span>
          </div>
        </div>
      )}

      {/* Live coordinate / speed readout under the scrubber */}
      {MAPS_KEY && hasTrack && current && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px 14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <MapPin width={13} height={13} style={{ color: 'var(--text-subtle)' }} />
            {current.lat.toFixed(5)}, {current.lng.toFixed(5)}
          </span>
          {current.speed != null && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {Math.round(current.speed)} km/h
            </span>
          )}
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
            {points.length} archived points
          </span>
        </div>
      )}
    </Card>
  );
}
