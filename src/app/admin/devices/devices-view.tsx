'use client';

import React from 'react';
import Link from 'next/link';
import { Table2, Map as MapIcon, MapPin, Smartphone } from 'lucide-react';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { HeartbeatCell } from '@/components/tad/heartbeat';
import { Badge, Button, Card, Tabs } from '@/components/ui';

/* Admin devices — Table / Map view toggle.
   `page.tsx` does the server fetch and hands us the rows; this client component owns the
   view switch + the Google map. Real data only — no fix → listed but not mapped. */

// Local row shape: existing /admin/devices fields + the frozen lat/lon/name additions.
export interface AdminDeviceRow {
  id: number | string;
  imei: string;
  name?: string | null;
  model: string | null;
  sim: string | null;
  status: 'active' | 'blocked' | 'pending' | string;
  owner: string | null;
  lastSeen?: string | null;
  heartbeatAt?: string | null;
  heartbeatIntervalS?: number | null;
  online?: boolean;
  lat?: number | null;
  lon?: number | null;
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success', pending: 'warning', blocked: 'danger',
};

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Pakistan fallback centre (Lahore) — matches the other portal maps.
const FALLBACK_CENTER = { lat: 31.5204, lng: 74.3587 };

// Marker fill by device state. Concrete hex (not CSS vars) so the colour resolves even when
// Google reparents the marker outside the .tad scope. Mirrors --success / --text-muted etc.
const MARKER_HEX: Record<string, string> = {
  active: '#1F9462',   // online/active → green (matches --success)
  pending: '#F5A524',  // pending → amber (matches --warning)
  blocked: '#F0463C',  // blocked → red (matches --danger)
  offline: '#8A7E6C',  // offline → muted sand (matches --text-muted)
};

function hasFix(d: AdminDeviceRow): boolean {
  return d.lat != null && d.lon != null && !isNaN(Number(d.lat)) && !isNaN(Number(d.lon));
}

// Colour key for a device: offline beats everything except a blocked status; otherwise by status.
function markerHexFor(d: AdminDeviceRow): string {
  if (d.status === 'blocked') return MARKER_HEX.blocked;
  if (d.status === 'pending') return MARKER_HEX.pending;
  if (!d.online) return MARKER_HEX.offline;
  return MARKER_HEX.active;
}

function deviceLabel(d: AdminDeviceRow): string {
  return (d.name && d.name.trim()) || d.imei || `Device ${d.id}`;
}

function MapsKeyPlaceholder({ minHeight = 320 }: { minHeight?: number }) {
  return (
    <div style={{ height: '100%', minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-strong)', gap: 8 }}>
      <MapPin className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
        Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
      </p>
    </div>
  );
}

export function DevicesView({ rows, loadError }: { rows: AdminDeviceRow[]; loadError: string | null }) {
  const [view, setView] = React.useState<'table' | 'map'>('table');
  const [selectedId, setSelectedId] = React.useState<AdminDeviceRow['id'] | null>(null);
  const [mapsReady, setMapsReady] = React.useState(false);

  const mapRef = React.useRef<HTMLDivElement>(null);
  const gmap = React.useRef<google.maps.Map | null>(null);
  const markers = React.useRef<Map<AdminDeviceRow['id'], google.maps.Marker>>(new Map());
  // Keep the latest rows in a ref so marker click listeners (bound once) see fresh data.
  const rowsRef = React.useRef<AdminDeviceRow[]>(rows);
  React.useEffect(() => { rowsRef.current = rows; }, [rows]);

  const located = React.useMemo(() => rows.filter(hasFix), [rows]);

  // ── Load Maps API (shared loader; dedup with data-tad-maps) ─────────────────
  React.useEffect(() => {
    if (typeof google !== 'undefined' && google.maps) { setMapsReady(true); return; }
    if (!MAPS_KEY) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-tad-maps]');
    if (existing) { existing.addEventListener('load', () => setMapsReady(true)); return; }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    s.async = true;
    s.dataset.tadMaps = '1';
    s.onload = () => setMapsReady(true);
    document.head.appendChild(s);
  }, []);

  // ── Init the map once it's visible (map view) and the API is ready ──────────
  React.useEffect(() => {
    if (view !== 'map' || !mapsReady || !mapRef.current || gmap.current) return;
    gmap.current = new google.maps.Map(mapRef.current, {
      center: FALLBACK_CENTER,
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  }, [view, mapsReady]);

  // ── Render / refresh markers whenever the located set or selection changes ──
  React.useEffect(() => {
    const map = gmap.current;
    if (view !== 'map' || !mapsReady || !map) return;

    const ids = new Set(located.map((d) => d.id));
    // Drop markers for devices that lost their fix / disappeared.
    markers.current.forEach((m, id) => {
      if (!ids.has(id)) { m.setMap(null); markers.current.delete(id); }
    });

    const bounds = new google.maps.LatLngBounds();
    located.forEach((d) => {
      const lat = Number(d.lat);
      const lng = Number(d.lon);
      const hex = markerHexFor(d);
      const isSel = d.id === selectedId;
      const icon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSel ? 9 : 6.5,
        fillColor: hex,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: isSel ? 3 : 2,
      };
      const existing = markers.current.get(d.id);
      if (existing) {
        existing.setPosition({ lat, lng });
        existing.setIcon(icon);
        existing.setZIndex(isSel ? 20 : 1);
        existing.setTitle(deviceLabel(d));
      } else {
        const mk = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: deviceLabel(d),
          icon,
          zIndex: isSel ? 20 : 1,
        });
        mk.addListener('click', () => selectDevice(d.id));
        markers.current.set(d.id, mk);
      }
      bounds.extend({ lat, lng });
    });

    // Frame everything only on the first paint (no selection yet) so we don't fight
    // the per-card fly-to animation.
    if (located.length > 0 && selectedId == null && !bounds.isEmpty()) {
      if (located.length === 1) { map.setCenter(bounds.getCenter()); map.setZoom(14); }
      else map.fitBounds(bounds, 60);
    }
  }, [view, mapsReady, located, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Select + animated pan/zoom to a device ──────────────────────────────────
  function selectDevice(id: AdminDeviceRow['id']) {
    setSelectedId(id);
    const map = gmap.current;
    const d = rowsRef.current.find((x) => x.id === id);
    if (map && d && hasFix(d)) {
      const lat = Number(d.lat);
      const lng = Number(d.lon);
      map.panTo({ lat, lng });
      if ((map.getZoom() ?? 6) < 15) setTimeout(() => map.setZoom(15), 220);
    }
    document.getElementById(`admin-device-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const stats = [
    { label: 'Active', value: rows.filter((d) => d.status === 'active').length },
    { label: 'Pending', value: rows.filter((d) => d.status === 'pending').length },
    { label: 'Blocked', value: rows.filter((d) => d.status === 'blocked').length },
  ];

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <StatRow stats={stats} />
        <Tabs
          variant="pill"
          value={view}
          onChange={(v) => setView(v as 'table' | 'map')}
          items={[
            { value: 'table', label: 'Table', icon: <Table2 /> },
            { value: 'map', label: 'Map', icon: <MapIcon /> },
          ]}
        />
      </div>

      {view === 'table' ? (
        /* SIM is admin-only per the privacy rules — never shown in tenant/my portals. */
        <DataTable<AdminDeviceRow>
          empty={loadError ?? 'No devices yet.'}
          rows={rows}
          columns={[
            { key: 'imei', header: 'IMEI', mono: true },
            { key: 'model', header: 'Model', render: (r) => r.model ?? '—' },
            { key: 'sim', header: 'SIM', mono: true, render: (r) => r.sim ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_BADGE[r.status] ?? 'neutral'}>{r.status}</Badge> },
            { key: 'owner', header: 'Owner', render: (r) => r.owner ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
            { key: 'lastSeen', header: 'Last seen', render: (r) => r.lastSeen ?? '—' },
            { key: 'heartbeat', header: 'Heartbeat', render: (r) => <HeartbeatCell online={r.online} at={r.heartbeatAt} intervalS={r.heartbeatIntervalS} /> },
            { key: 'act', header: '', align: 'right', render: (r) => <Link href={`/admin/devices/${r.id}`}><Button variant="ghost" size="sm">View</Button></Link> },
          ]}
        />
      ) : (
        <MapView
          rows={rows}
          located={located}
          loadError={loadError}
          selectedId={selectedId}
          onSelect={selectDevice}
          mapRef={mapRef}
          mapsReady={mapsReady}
        />
      )}
    </div>
  );
}

// ── Map view: split layout (left scroll list + sticky map). Mirrors exclusion-beats. ──
function MapView({
  rows, located, loadError, selectedId, onSelect, mapRef, mapsReady,
}: {
  rows: AdminDeviceRow[];
  located: AdminDeviceRow[];
  loadError: string | null;
  selectedId: AdminDeviceRow['id'] | null;
  onSelect: (id: AdminDeviceRow['id']) => void;
  mapRef: React.RefObject<HTMLDivElement | null>;
  mapsReady: boolean;
}) {
  return (
    <div className="tad-dev-split">
      {/* LEFT — scrollable list of device cards */}
      <div className="tad-dev-list">
        {rows.length === 0 ? (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '28px 8px' }}>
              <Smartphone className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
                {loadError ?? 'No devices yet.'}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {MAPS_KEY && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '2px 2px 0', fontFamily: 'var(--font-mono)' }}>
                {located.length} of {rows.length} located
              </div>
            )}
            {rows.map((d) => {
              const isSel = d.id === selectedId;
              const fix = hasFix(d);
              const hex = markerHexFor(d);
              return (
                <div
                  key={d.id}
                  id={`admin-device-${d.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(d.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d.id); } }}
                  className="tad-dev-card"
                  aria-pressed={isSel}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                    background: isSel ? 'var(--brand-subtle)' : 'var(--surface)',
                    boxShadow: isSel ? '0 0 0 3px color-mix(in srgb, var(--brand) 14%, transparent)' : undefined,
                    cursor: 'pointer',
                    opacity: fix ? 1 : 0.72,
                    transition: 'border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
                  }}
                >
                  {/* online dot */}
                  <span
                    title={d.online ? 'online' : 'offline'}
                    style={{
                      width: 10, height: 10, marginTop: 4, borderRadius: 99, flex: 'none',
                      background: fix ? hex : 'var(--text-subtle)',
                      boxShadow: d.online ? `0 0 0 3px color-mix(in srgb, ${hex} 28%, transparent)` : 'none',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text)', fontSize: 'var(--text-sm)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deviceLabel(d)}
                    </div>
                    <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.imei}
                    </div>
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Badge variant={STATUS_BADGE[d.status] ?? 'neutral'}>{d.status}</Badge>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {d.lastSeen ?? 'Never seen'}
                      </span>
                    </div>
                    {!fix && (
                      <div style={{ marginTop: 4, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>No location</div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* RIGHT — map (sticky) */}
      <div className="tad-dev-mapwrap">
        {!MAPS_KEY ? (
          <MapsKeyPlaceholder />
        ) : (
          <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: 320, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', visibility: mapsReady ? 'visible' : 'hidden' }} />
        )}
      </div>

      <style>{`
        .tad-dev-split {
          display: grid;
          grid-template-columns: minmax(280px, 380px) 1fr;
          gap: var(--space-5);
          align-items: start;
        }
        .tad-dev-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: calc(100vh - var(--topbar-h, 60px) - 220px);
          overflow-y: auto;
          padding-right: 4px;
        }
        .tad-dev-card:hover { border-color: var(--border-strong) !important; }
        .tad-dev-mapwrap {
          position: sticky;
          top: 0;
          height: calc(100vh - var(--topbar-h, 60px) - 220px);
          min-height: 320px;
        }
        @media (max-width: 860px) {
          .tad-dev-split { grid-template-columns: 1fr; }
          .tad-dev-list { max-height: none; order: 2; }
          .tad-dev-mapwrap { position: relative; order: 1; height: 360px; }
        }
      `}</style>
    </div>
  );
}
