'use client';

import React from 'react';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Button, Card, Input } from '@/components/ui';
import { type ExclusionBeat } from '@/lib/portal-data';

type LatLng = { lat: number; lng: number };

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const DEFAULT_COLOR = '#F0463C';

// Pixels within which clicking near the first vertex auto-closes the polygon
const SNAP_PX = 20;

export function ExclusionBeatsClient({ initial, loadError }: { initial: ExclusionBeat[]; loadError: string | null }) {
  const [rows, setRows] = React.useState<ExclusionBeat[]>(initial);
  const [editing, setEditing] = React.useState<ExclusionBeat | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(DEFAULT_COLOR);
  const [coords, setCoords] = React.useState<LatLng[]>([]);
  const [drawing, setDrawing] = React.useState(false);
  const [tempPts, setTempPts] = React.useState<LatLng[]>([]);
  const [mapsReady, setMapsReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mapRef = React.useRef<HTMLDivElement>(null);
  const gmap = React.useRef<google.maps.Map | null>(null);
  const poly = React.useRef<google.maps.Polygon | null>(null);
  const preview = React.useRef<google.maps.Polyline | null>(null);
  const markers = React.useRef<google.maps.Marker[]>([]);
  const clickListener = React.useRef<google.maps.MapsEventListener | null>(null);
  const dblClickListener = React.useRef<google.maps.MapsEventListener | null>(null);
  const lastDblClick = React.useRef<number>(0);

  // Keep a ref of tempPts so event handlers always see the latest value
  const tempPtsRef = React.useRef<LatLng[]>([]);
  React.useEffect(() => { tempPtsRef.current = tempPts; }, [tempPts]);

  // Keep a ref of color so listeners bound once still draw with the latest hue
  const colorRef = React.useRef(color);
  React.useEffect(() => { colorRef.current = color; }, [color]);

  // ── Load Maps API ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!showForm) return;
    if (typeof google !== 'undefined') { setMapsReady(true); return; }
    if (!MAPS_KEY) return;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    s.async = true;
    s.onload = () => setMapsReady(true);
    document.head.appendChild(s);
  }, [showForm]);

  // ── Init map ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!showForm || !mapsReady || !mapRef.current || gmap.current) return;
    const center = coords.length > 0 ? coords[0] : { lat: 31.5204, lng: 74.3587 };
    const map = new google.maps.Map(mapRef.current, {
      center, zoom: coords.length > 0 ? 13 : 10,
      disableDoubleClickZoom: true,
    });
    gmap.current = map;
    if (coords.length > 0) renderPolygon(map, coords, color);
  }, [showForm, mapsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drawing mode ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const map = gmap.current;
    if (!map) return;

    clickListener.current && google.maps.event.removeListener(clickListener.current);
    dblClickListener.current && google.maps.event.removeListener(dblClickListener.current);

    if (!drawing) {
      map.setOptions({ cursor: '' });
      return;
    }

    map.setOptions({ cursor: 'crosshair' });

    clickListener.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      // Ignore this click if it fired within 300 ms of the last dblclick
      if (Date.now() - lastDblClick.current < 300) return;

      const pt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      const current = tempPtsRef.current;

      // Snap-to-first: if ≥ 3 points already and click is near the first vertex, close
      if (current.length >= 3 && map) {
        const first = current[0];
        const proj = map.getProjection();
        const zoom = map.getZoom() ?? 10;
        const scale = Math.pow(2, zoom);
        if (proj) {
          const fp = proj.fromLatLngToPoint(new google.maps.LatLng(first.lat, first.lng));
          const cp = proj.fromLatLngToPoint(new google.maps.LatLng(pt.lat, pt.lng));
          if (fp && cp) {
            const dx = (fp.x - cp.x) * scale;
            const dy = (fp.y - cp.y) * scale;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < SNAP_PX) {
              finishDrawing(current);
              setTempPts([]);
              return;
            }
          }
        }
      }

      setTempPts((prev) => {
        const next = [...prev, pt];
        updatePreview(map, next, colorRef.current);
        return next;
      });
    });

    dblClickListener.current = map.addListener('dblclick', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      lastDblClick.current = Date.now();
      const pts = tempPtsRef.current;
      if (pts.length >= 3) {
        finishDrawing(pts);
        setTempPts([]);
      }
    });

    return () => {
      clickListener.current && google.maps.event.removeListener(clickListener.current);
      dblClickListener.current && google.maps.event.removeListener(dblClickListener.current);
    };
  }, [drawing]); // eslint-disable-line react-hooks/exhaustive-deps

  function updatePreview(map: google.maps.Map, pts: LatLng[], hex: string) {
    markers.current.forEach((m) => m.setMap(null));
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

    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    preview.current?.setMap(null);
    preview.current = null;

    renderPolygon(map, pts, colorRef.current);
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
    const sync = () => setCoords(path.getArray().map((ll: google.maps.LatLng) => ({ lat: ll.lat(), lng: ll.lng() })));
    path.addListener('set_at', sync);
    path.addListener('insert_at', sync);
    path.addListener('remove_at', sync);

    const bounds = new google.maps.LatLngBounds();
    vertices.forEach((v) => bounds.extend(v));
    map.fitBounds(bounds, 60);
  }

  function clearPolygon() {
    poly.current?.setMap(null); poly.current = null;
    preview.current?.setMap(null); preview.current = null;
    markers.current.forEach((m) => m.setMap(null)); markers.current = [];
    setCoords([]); setTempPts([]); setDrawing(false);
  }

  function cancelDrawing() {
    markers.current.forEach((m) => m.setMap(null)); markers.current = [];
    preview.current?.setMap(null); preview.current = null;
    setTempPts([]); setDrawing(false);
  }

  function handleColorChange(hex: string) {
    setColor(hex);
    colorRef.current = hex;
    if (poly.current) poly.current.setOptions({ fillColor: hex, strokeColor: hex });
    if (preview.current) preview.current.setOptions({ strokeColor: hex });
    markers.current.forEach((m, i) => m.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: i === 0 ? 7 : 5,
      fillColor: hex, fillOpacity: 1,
      strokeColor: '#fff', strokeWeight: 2,
    }));
  }

  function teardownMap() {
    poly.current?.setMap(null); poly.current = null;
    preview.current?.setMap(null); preview.current = null;
    markers.current.forEach((m) => m.setMap(null)); markers.current = [];
    clickListener.current && google.maps.event.removeListener(clickListener.current);
    dblClickListener.current && google.maps.event.removeListener(dblClickListener.current);
    gmap.current = null;
  }

  function openCreate() {
    setEditing(null);
    setName('');
    setColor(DEFAULT_COLOR);
    colorRef.current = DEFAULT_COLOR;
    setCoords([]);
    setTempPts([]);
    setDrawing(false);
    setError(null);
    teardownMap();
    setShowForm(true);
  }

  function openEdit(z: ExclusionBeat) {
    setEditing(z);
    setName(z.name);
    setColor(z.color ?? DEFAULT_COLOR);
    colorRef.current = z.color ?? DEFAULT_COLOR;
    setCoords(z.coordinates ?? []);
    setTempPts([]);
    setDrawing(false);
    setError(null);
    teardownMap();
    setShowForm(true);
  }

  function closeForm() {
    teardownMap();
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (coords.length < 3) { setError('Draw a zone with at least 3 points.'); return; }
    setBusy(true);
    const body = {
      name: name.trim(),
      color,
      geo_fence_type: 'polygon',
      coordinates: coords,
    };
    try {
      const url = editing ? `/api/admin/exclusion-beats/${editing.id}` : '/api/admin/exclusion-beats';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.message ?? 'Could not save the zone.'); return; }
      setRows((r) => editing ? r.map((x) => (x.id === editing.id ? data : x)) : [data, ...r]);
      closeForm();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(z: ExclusionBeat) {
    if (!window.confirm(`Delete "${z.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/exclusion-beats/${z.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { window.alert(data?.message ?? 'Could not delete this zone.'); return; }
      setRows((r) => r.filter((x) => x.id !== z.id));
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  const enoughPoints = coords.length >= 3;

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatRow stats={[
          { label: 'Zones', value: rows.length },
          { label: 'Vertices', value: rows.reduce((n, z) => n + (z.coordinates?.length || 0), 0) },
        ]} />
        <Button onClick={openCreate}>New zone</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            {editing ? `Edit ${editing.name}` : 'New zone'}
          </div>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Restricted military zone" autoFocus required />
              </div>
              <div className="tad-field" style={{ minWidth: 120 }}>
                <label className="tad-field__label">Colour</label>
                <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)}
                  style={{ width: 44, height: 38, cursor: 'pointer', padding: 2, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>
                  Zone polygon
                  {coords.length > 0 && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{coords.length} vertices</span>}
                  {drawing && tempPts.length > 0 && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>drawing… {tempPts.length} pts</span>}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {MAPS_KEY && !drawing && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => { if (coords.length > 0) clearPolygon(); setDrawing(true); }}>
                      {coords.length > 0 ? 'Redraw' : 'Draw'}
                    </Button>
                  )}
                  {drawing && (
                    <>
                      <Button type="button" size="sm" disabled={tempPts.length < 3} onClick={() => finishDrawing(tempPts)}>Done ({tempPts.length} pts)</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={cancelDrawing}>Cancel</Button>
                    </>
                  )}
                  {coords.length > 0 && !drawing && (
                    <Button type="button" variant="danger" size="sm" onClick={clearPolygon}>Clear</Button>
                  )}
                </div>
              </div>

              {!MAPS_KEY ? (
                <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-strong)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Google Maps API key not configured.</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', marginTop: 4 }}>Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable drawing.</p>
                  </div>
                </div>
              ) : (
                <div ref={mapRef} style={{ height: 320, overflow: 'hidden', borderRadius: 'var(--radius-xl)', border: drawing ? '1px solid var(--warning)' : '1px solid var(--border)', boxShadow: drawing ? '0 0 0 3px var(--warning-bg)' : undefined }} />
              )}

              {drawing && (
                <p style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
                  Click to place vertices · Double-click or click near the first point to finish · Minimum 3 points
                </p>
              )}
              {!drawing && !enoughPoints && (
                <p style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Click the map to draw at least 3 points.</p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button type="submit" loading={busy} disabled={busy || !enoughPoints || !name.trim()}>{editing ? 'Save' : 'Create'}</Button>
              <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </Card>
      )}

      <DataTable<ExclusionBeat>
        empty={loadError ?? 'No exclusion zones yet — draw one to restrict devices from an area.'}
        rows={rows}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'color', header: 'Colour', render: (r) => (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: r.color ?? DEFAULT_COLOR, border: '1px solid var(--border-strong)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.color ?? DEFAULT_COLOR}</span>
            </span>
          ) },
          { key: 'vertices', header: 'Vertices', align: 'center', mono: true, render: (r) => r.coordinates?.length ?? 0 },
          { key: 'createdAt', header: 'Created', mono: true, render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
          { key: 'act', header: '', align: 'right', render: (r) => (
            <span style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={busy} onClick={() => remove(r)}>Delete</Button>
            </span>
          ) },
        ]}
      />
    </div>
  );
}
