'use client';
import React from 'react';
import { MapMarker, type MarkerShape, type MarkerKind, type MarkerStatus, StatusDot, Switch, Card, Badge, Metric } from '@/components/ui';

/* "My things" customer-portal shell — live map + device list + notification toggles.
   Placeholder devices; wire to app REST (via the Cloudflare BFF) + Soketi in Phase 5b. */

type Thing = {
  id: string; name: string; plate?: string;
  shape: MarkerShape; kind?: MarkerKind; status: MarkerStatus;
  battery: number; heading?: number; top: number; left: number;
};

const THINGS: Thing[] = [
  { id: '1', name: 'Family Civic', plate: 'LEB-4471', shape: 'arrow', status: 'moving', battery: 82, heading: 42, top: 30, left: 28 },
  { id: '2', name: 'CD 70 bike', plate: 'LES-9920', shape: 'pin', kind: 'car', status: 'parked', battery: 64, top: 62, left: 54 },
  { id: '3', name: 'Field rider', shape: 'circle', status: 'moving', battery: 47, top: 42, left: 72 },
  { id: '4', name: 'Delivery van', plate: 'LEC-3310', shape: 'pin', kind: 'truck', status: 'offline', battery: 12, top: 72, left: 80 },
];

export function PortalClient() {
  const [sel, setSel] = React.useState<string | null>(null);
  const moving = THINGS.filter((t) => t.status === 'moving').length;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-10)', flexWrap: 'wrap' }}>
        <Metric label="Things" value={THINGS.length} />
        <Metric label="Moving now" value={moving} />
        <Metric label="Offline" value={THINGS.filter((t) => t.status === 'offline').length} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 2fr) minmax(240px, 1fr)', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Map */}
        <Card flushBody>
          <div className="tad-dot-bg" style={{ position: 'relative', height: 440, background: 'var(--map-land)' }}>
            {THINGS.map((t) => (
              <MapMarker
                key={t.id}
                shape={t.shape}
                kind={t.kind}
                status={t.status}
                heading={t.heading}
                top={t.top}
                left={t.left}
                size={36}
                selected={sel === t.id}
                label={t.name}
                onClick={() => setSel(t.id)}
              />
            ))}
          </div>
        </Card>

        {/* Side panel */}
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <Card title="My things">
            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
              {THINGS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSel(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: 'var(--space-2) var(--space-3)', border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderRadius: 'var(--radius-md)', background: sel === t.id ? 'var(--brand-subtle)' : 'transparent',
                  }}
                >
                  <span style={{ display: 'grid' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
                    {t.plate && <span className="tad-data" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{t.plate}</span>}
                  </span>
                  <span style={{ display: 'grid', justifyItems: 'end', gap: 2 }}>
                    <StatusDot status={t.status} size="md" />
                    <span className="tad-data" style={{ fontSize: 'var(--text-xs)', color: t.battery < 20 ? 'var(--danger)' : 'var(--text-muted)' }}>{t.battery}%</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Notifications">
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <Switch label="Move alerts" defaultChecked />
              <Switch label="Geofence enter / exit" defaultChecked />
              <Switch label="Low battery" />
            </div>
          </Card>

          <Card title="Recent alerts">
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Badge variant="warning">Speeding</Badge><span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Family Civic · 64 km/h</span></span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Badge variant="danger" dot>Offline</Badge><span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Delivery van · 2h ago</span></span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
