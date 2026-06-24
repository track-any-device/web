'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui';

/* Last-known position of one device on a Google map — the admin counterpart of the /my device map.
   Uses the device's stored last_lat/last_lon (no live trail; the admin detail endpoint returns only
   the latest fix). Real position only — when there's no fix, a friendly empty state, never a guess.

   The card is the 4th cell of a 4-column CSS grid row, so the row stretches it to match its taller
   neighbours. We make the card body flex-fill (the scoped style below grows .tad-card__body, which the
   Card component doesn't do by default) and the map fill that body, with a minHeight floor so a short
   row never collapses the map. */

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const MIN_MAP_HEIGHT = 200;

export function DeviceMapCard({ lat, lon, online, name }: {
  lat: number | null;
  lon: number | null;
  online?: boolean;
  name?: string | null;
}) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const gmapRef = React.useRef<google.maps.Map | null>(null);
  const [ready, setReady] = React.useState(false);

  const hasLocation = lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon);
  const color = online ? '#1F9462' : '#8A7E6C'; // online green / offline muted

  // Load the Maps script once — shares the data-tad-maps dedup guard with the /my device map.
  React.useEffect(() => {
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

  // Init / sync a single-device map: one status-coloured marker centred on the last fix.
  React.useEffect(() => {
    if (!ready || !mapRef.current || !hasLocation) return;
    const center = { lat: lat!, lng: lon! };

    if (!gmapRef.current) {
      gmapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapId: 'admin-device-detail-map',
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
    } else {
      gmapRef.current.panTo(center);
    }
    const map = gmapRef.current;

    const dot = document.createElement('div');
    dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AdvMarker = (google.maps as any).marker?.AdvancedMarkerElement;
    let marker: { setMap: (m: google.maps.Map | null) => void };
    if (AdvMarker) {
      marker = new AdvMarker({ map, position: center, content: dot });
    } else {
      marker = new google.maps.Marker({
        position: center, map, title: name ?? undefined,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      }) as unknown as { setMap: (m: google.maps.Map | null) => void };
    }

    return () => { marker.setMap(null); };
  }, [ready, hasLocation, lat, lon, color, name]);

  // Shared style for the body wrapper so the map (or empty state) fills the stretched card height.
  const fillBody: React.CSSProperties = {
    height: '100%',
    minHeight: MIN_MAP_HEIGHT,
    position: 'relative',
    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
    overflow: 'hidden',
  };

  return (
    <Card title="Location" flushBody className="admin-device-map-card" style={{ height: '100%' }}>
      {/* Grow .tad-card__body to fill the card; the Card component doesn't flex its body by default. */}
      <style>{`.admin-device-map-card .tad-card__body{flex:1;min-height:0;display:flex;}`}</style>
      <div style={fillBody}>
        {!MAPS_KEY ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg-sunken)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Set <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
            </p>
          </div>
        ) : !hasLocation ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: 'var(--bg-sunken)', gap: 8 }}>
            <MapPin style={{ width: 32, height: 32, color: 'var(--text-subtle)' }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No position reported yet.</p>
          </div>
        ) : <div ref={mapRef} style={{ width: '100%', height: '100%' }} />}
      </div>
    </Card>
  );
}
