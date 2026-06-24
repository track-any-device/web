'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { eventLabel } from '@/lib/portal-data';
import type { AdminIncidentRow, DayWindow } from './incidents-types';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const PRIORITY: Record<string, 'danger' | 'warning' | 'neutral'> = { critical: 'danger', high: 'warning', medium: 'neutral', low: 'neutral', info: 'neutral' };
const STATUS: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = { open: 'danger', acknowledged: 'warning', escalated: 'danger', resolved: 'success', dismissed: 'neutral' };

// Flag glyph colour by priority — critical=danger, high=warning, else brand.
function priorityColor(priority: string | null): string {
  if (priority === 'critical') return 'var(--danger)';
  if (priority === 'high') return 'var(--warning)';
  return 'var(--brand)';
}

// lucide `Flag` glyph as an inline SVG (drawn into an AdvancedMarkerElement content div).
// `fill` paints the flag body in the priority colour; the white stroke gives it a map outline.
function flagMarkerSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="${fill}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
}

const DAY_OPTIONS: DayWindow[] = [7, 30, 90];

export function IncidentsView({ initialRows, initialDays }: { initialRows: AdminIncidentRow[]; initialDays: DayWindow }) {
  const [rows, setRows] = useState<AdminIncidentRow[]>(initialRows);
  const [days, setDays] = useState<DayWindow>(initialDays);
  const [view, setView] = useState<'table' | 'map'>('table');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refetch through the BFF whenever the day window changes (skip the initial value,
  // which the server already seeded).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/incidents?days=${days}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json: unknown) => { if (!cancelled) setRows(Array.isArray(json) ? (json as AdminIncidentRow[]) : []); })
      .catch(() => { if (!cancelled) { setRows([]); setError('Could not load incidents for this window.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const located = rows.filter((r) => r.lat != null && r.lon != null && !Number.isNaN(Number(r.lat)) && !Number.isNaN(Number(r.lon)));
  const missing = rows.length - located.length;

  return (
    <>
      {/* Controls — view toggle + day filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <Segmented<'table' | 'map'>
          value={view}
          onChange={setView}
          options={[{ value: 'table', label: 'Table' }, { value: 'map', label: 'Map' }]}
        />
        <Segmented<DayWindow>
          value={days}
          onChange={(d) => setDays(d)}
          options={DAY_OPTIONS.map((d) => ({ value: d, label: `${d} days` }))}
        />
      </div>

      <StatRow stats={[
        { label: 'Open', value: rows.filter((i) => i.status === 'open').length },
        { label: 'Acknowledged', value: rows.filter((i) => i.status === 'acknowledged').length },
        { label: 'Resolved', value: rows.filter((i) => i.status === 'resolved').length },
      ]} />

      {error && (
        <div className="tad-card" style={{ padding: '10px 14px', fontSize: 'var(--text-sm)', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
          {error}
        </div>
      )}

      {view === 'table' ? (
        <DataTable<AdminIncidentRow>
          empty={loading ? 'Loading…' : 'No incidents.'}
          rows={rows}
          columns={[
            { key: 'id', header: 'Incident', mono: true, render: (r) => <Link href={`/admin/incidents/${r.id}`}>{r.id}</Link> },
            { key: 'priority', header: 'Priority', render: (r) => <Badge variant={PRIORITY[r.priority ?? ''] ?? 'neutral'}>{r.priority ?? '—'}</Badge> },
            { key: 'eventType', header: 'Event', render: (r) => r.label ?? eventLabel(r.eventType) },
            { key: 'device', header: 'Device IMEI', mono: true, render: (r) => r.device ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status ?? ''] ?? 'neutral'}>{r.status ?? '—'}</Badge> },
            { key: 'openedAt', header: 'Opened', render: (r) => r.openedAt ?? '—' },
            { key: 'act', header: '', align: 'right', render: (r) => <Link href={`/admin/incidents/${r.id}`}><Button variant="ghost" size="sm">View</Button></Link> },
          ]}
        />
      ) : (
        <IncidentsMap rows={located} loading={loading} />
      )}

      {/* Map-mode note: incidents without coordinates can't be plotted. */}
      {view === 'map' && missing > 0 && rows.length > 0 && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {missing} of {rows.length} have no location and are only shown in the table.
        </p>
      )}
    </>
  );
}

// ── Segmented control (design-system tokens; reused for both toggles) ────────────
function Segmented<T extends string | number>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={on}
            style={{
              padding: '5px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', border: 'none',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
              background: on ? 'var(--surface)' : 'transparent',
              color: on ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: on ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Map view — one flag marker per located incident ──────────────────────────────
function IncidentsMap({ rows, loading }: { rows: AdminIncidentRow[]; loading: boolean }) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const gmapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Array<{ setMap: (m: google.maps.Map | null) => void }>>([]);
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

  // Plot the located incidents and fit the view to them.
  useEffect(() => {
    if (!ready || !mapRef.current || rows.length === 0) return;

    if (!gmapRef.current) {
      gmapRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: Number(rows[0].lat), lng: Number(rows[0].lon) },
        zoom: 11,
        mapId: 'admin-incidents-map',
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
    }
    const map = gmapRef.current;

    // Clear previous markers before re-plotting.
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AdvMarker = (google.maps as any).marker?.AdvancedMarkerElement;
    const bounds = new google.maps.LatLngBounds();

    rows.forEach((r) => {
      const position = { lat: Number(r.lat), lng: Number(r.lon) };
      bounds.extend(position);
      const color = priorityColor(r.priority);
      const go = () => router.push(`/admin/incidents/${r.id}`);

      let marker: { setMap: (m: google.maps.Map | null) => void };
      if (AdvMarker) {
        const content = document.createElement('div');
        content.style.cssText = 'cursor:pointer;line-height:0';
        content.innerHTML = flagMarkerSvg(color);
        marker = new AdvMarker({ map, position, content, title: r.label ?? r.eventType ?? String(r.id) });
        content.addEventListener('click', go);
      } else {
        const m = new google.maps.Marker({
          position, map, title: r.label ?? r.eventType ?? String(r.id),
          icon: { path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 5, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1.5 },
        });
        m.addListener('click', go);
        marker = m as unknown as { setMap: (m: google.maps.Map | null) => void };
      }
      markersRef.current.push(marker);
    });

    if (rows.length === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, 64);
    }

    return () => { markersRef.current.forEach((m) => m.setMap(null)); markersRef.current = []; };
  }, [ready, rows, router]);

  return (
    <div className="tad-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 460, position: 'relative' }}>
        {!MAPS_KEY ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg-sunken)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg-sunken)', gap: 8 }}>
            <MapPin style={{ width: 32, height: 32, color: 'var(--text-subtle)' }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{loading ? 'Loading…' : 'No incidents with a location in this window.'}</p>
          </div>
        ) : <div ref={mapRef} style={{ width: '100%', height: '100%' }} />}
      </div>
    </div>
  );
}
