'use client';

import React from 'react';
import { Pencil, Trash2, MapPin, Hexagon } from 'lucide-react';
import { StatRow } from '@/components/tad/data-table';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { Button, Card, IconButton, Input } from '@/components/ui';
import { type ExclusionBeat } from '@/lib/portal-data';

type LatLng = { lat: number; lng: number };

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const DEFAULT_COLOR = '#F0463C';

// Pixels within which clicking near the first vertex auto-closes the polygon
const SNAP_PX = 20;

// Pakistan fallback centre (Lahore) — matches the draw map default
const FALLBACK_CENTER: LatLng = { lat: 31.5204, lng: 74.3587 };

// Mean lat/lng of a zone's polygon vertices (used for panTo fallback + card meta)
function zoneCentroid(coords: LatLng[]): LatLng | null {
  if (!coords || coords.length === 0) return null;
  const sum = coords.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / coords.length, lng: sum.lng / coords.length };
}

export function ExclusionBeatsClient({ initial, loadError }: { initial: ExclusionBeat[]; loadError: string | null }) {
  const [rows, setRows] = React.useState<ExclusionBeat[]>(initial);
  const [editing, setEditing] = React.useState<ExclusionBeat | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<ExclusionBeat['id'] | null>(null);
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(DEFAULT_COLOR);
  const [coords, setCoords] = React.useState<LatLng[]>([]);
  const [drawing, setDrawing] = React.useState(false);
  const [tempPts, setTempPts] = React.useState<LatLng[]>([]);
  const [mapsReady, setMapsReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Form (draw) map refs ────────────────────────────────────────────────────
  const mapRef = React.useRef<HTMLDivElement>(null);
  const gmap = React.useRef<google.maps.Map | null>(null);
  const poly = React.useRef<google.maps.Polygon | null>(null);
  const preview = React.useRef<google.maps.Polyline | null>(null);
  const markers = React.useRef<google.maps.Marker[]>([]);
  const clickListener = React.useRef<google.maps.MapsEventListener | null>(null);
  const dblClickListener = React.useRef<google.maps.MapsEventListener | null>(null);
  const lastDblClick = React.useRef<number>(0);

  // ── Overview map refs (shows ALL zones; drives the fly-to) ───────────────────
  const overviewRef = React.useRef<HTMLDivElement>(null);
  const overviewMap = React.useRef<google.maps.Map | null>(null);
  const overviewPolys = React.useRef<Map<ExclusionBeat['id'], google.maps.Polygon>>(new Map());

  // Keep a ref of tempPts so event handlers always see the latest value
  const tempPtsRef = React.useRef<LatLng[]>([]);
  React.useEffect(() => { tempPtsRef.current = tempPts; }, [tempPts]);

  // Keep a ref of color so listeners bound once still draw with the latest hue
  const colorRef = React.useRef(color);
  React.useEffect(() => { colorRef.current = color; }, [color]);

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

  // ── Overview map: init once, then render all zone polygons ───────────────────
  React.useEffect(() => {
    if (!mapsReady || !overviewRef.current || overviewMap.current) return;
    overviewMap.current = new google.maps.Map(overviewRef.current, {
      center: FALLBACK_CENTER,
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  }, [mapsReady]);

  // Re-draw the overview polygons whenever the rows or selection change.
  React.useEffect(() => {
    const map = overviewMap.current;
    if (!mapsReady || !map) return;

    // Clear previous polygons
    overviewPolys.current.forEach((p) => p.setMap(null));
    overviewPolys.current.clear();

    const bounds = new google.maps.LatLngBounds();
    let any = false;

    rows.forEach((z) => {
      const verts = z.coordinates ?? [];
      if (verts.length < 3) return;
      const hex = z.color ?? DEFAULT_COLOR;
      const isSel = z.id === selectedId;
      const p = new google.maps.Polygon({
        paths: verts,
        map,
        fillColor: hex,
        fillOpacity: isSel ? 0.42 : 0.18,
        strokeColor: hex,
        strokeOpacity: 1,
        strokeWeight: isSel ? 3.5 : 1.5,
        zIndex: isSel ? 20 : 1,
        clickable: true,
      });
      p.addListener('click', () => selectZone(z));
      overviewPolys.current.set(z.id, p);
      verts.forEach((v) => bounds.extend(v));
      any = true;
    });

    // Frame everything only on first paint (no selection yet) so we don't fight
    // the per-card fly-to animation.
    if (any && selectedId == null && !bounds.isEmpty()) {
      map.fitBounds(bounds, 48);
    }
  }, [mapsReady, rows, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated fly-to: frame the zone via fitBounds (animated), else panTo ──────
  function flyToZone(z: ExclusionBeat) {
    const map = overviewMap.current;
    if (!map) return;
    const verts = z.coordinates ?? [];
    if (verts.length >= 3) {
      const bounds = new google.maps.LatLngBounds();
      verts.forEach((v) => bounds.extend(v));
      // fitBounds pans+zooms smoothly to frame the polygon with a little padding.
      map.fitBounds(bounds, 80);
    } else {
      const c = zoneCentroid(verts);
      if (c) { map.panTo(c); map.setZoom(14); }
    }
  }

  function selectZone(z: ExclusionBeat) {
    setSelectedId(z.id);
    flyToZone(z);
  }

  // ── Form draw map: init when the form opens ─────────────────────────────────
  React.useEffect(() => {
    if (!showForm || !mapsReady || !mapRef.current || gmap.current) return;
    const center = coords.length > 0 ? coords[0] : FALLBACK_CENTER;
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
      map.setOptions({ draggableCursor: '' });
      return;
    }

    map.setOptions({ draggableCursor: 'crosshair' });

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
      setSelectedId((id) => (id === z.id ? null : id));
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  const enoughPoints = coords.length >= 3;
  const totalVertices = rows.reduce((n, z) => n + (z.coordinates?.length || 0), 0);

  return (
    <>
      <PortalTopbar
        title="Exclusion zones"
        subtitle="No-go areas — every device is restricted unless its type is exempt"
        right={<Button onClick={openCreate}>New zone</Button>}
      />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Zones', value: rows.length },
          { label: 'Vertices', value: totalVertices },
        ]} />

      {showForm && (
        <Card style={{ marginBottom: 0 }}>
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

      {/* ── Split: zone list (left, scrollable) + overview map (right, sticky) ── */}
      <div className="tad-excl-split">
        {/* LEFT — scrollable list of zone cards */}
        <div className="tad-excl-list">
          {rows.length === 0 ? (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '28px 8px' }}>
                <Hexagon className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
                  {loadError ?? 'No exclusion zones yet — draw one to restrict devices from an area.'}
                </p>
                {!loadError && (
                  <Button size="sm" variant="secondary" onClick={openCreate}>New zone</Button>
                )}
              </div>
            </Card>
          ) : (
            rows.map((z) => {
              const hex = z.color ?? DEFAULT_COLOR;
              const isSel = z.id === selectedId;
              const vertexCount = z.coordinates?.length ?? 0;
              return (
                <div
                  key={z.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectZone(z)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectZone(z); } }}
                  className="tad-excl-card"
                  aria-pressed={isSel}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isSel ? 'var(--brand)' : 'var(--border)'}`,
                    background: isSel ? 'var(--brand-subtle)' : 'var(--surface)',
                    boxShadow: isSel ? '0 0 0 3px color-mix(in srgb, var(--brand) 14%, transparent)' : undefined,
                    cursor: 'pointer',
                    transition: 'border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
                  }}
                >
                  <span style={{ width: 16, height: 16, marginTop: 2, borderRadius: 5, background: hex, border: '1px solid var(--border-strong)', flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text)', fontSize: 'var(--text-sm)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.name}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize' }}>{z.geoFenceType ?? 'polygon'}</span>
                      <span aria-hidden style={{ opacity: 0.4 }}>·</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{vertexCount} pts</span>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', gap: 2, flex: 'none' }} onClick={(e) => e.stopPropagation()}>
                    <IconButton size="sm" label={`Edit ${z.name}`} onClick={() => openEdit(z)}>
                      <Pencil />
                    </IconButton>
                    <IconButton size="sm" label={`Delete ${z.name}`} disabled={busy}
                      onClick={() => remove(z)}
                      style={{ color: 'var(--danger)' }}>
                      <Trash2 />
                    </IconButton>
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — overview map (sticky) */}
        <div className="tad-excl-mapwrap">
          {!MAPS_KEY ? (
            <div style={{ height: '100%', minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-strong)', gap: 8 }}>
              <MapPin className="w-8 h-8" style={{ color: 'var(--text-subtle)' }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
              </p>
            </div>
          ) : (
            <div ref={overviewRef} style={{ height: '100%', width: '100%', minHeight: 320, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }} />
          )}
        </div>
      </div>

      <style>{`
        .tad-excl-split {
          display: grid;
          grid-template-columns: minmax(280px, 380px) 1fr;
          gap: var(--space-5);
          align-items: start;
        }
        .tad-excl-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: calc(100vh - var(--topbar-h, 60px) - 220px);
          overflow-y: auto;
          padding-right: 4px;
        }
        .tad-excl-card:hover { border-color: var(--border-strong) !important; }
        .tad-excl-mapwrap {
          position: sticky;
          top: 0;
          height: calc(100vh - var(--topbar-h, 60px) - 220px);
          min-height: 320px;
        }
        @media (max-width: 860px) {
          .tad-excl-split { grid-template-columns: 1fr; }
          .tad-excl-list { max-height: none; order: 2; }
          .tad-excl-mapwrap { position: relative; order: 1; height: 360px; }
        }
      `}</style>
    </div>
    </>
  );
}
