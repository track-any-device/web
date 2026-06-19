'use client';
import React from 'react';
import {
  Button, IconButton, Input, Select, Switch, OTPInput,
  Badge, StatusDot, Tag, Card, Metric, Tabs, MapMarker,
} from '@/components/ui';

/* Dev gallery for the TAD-PAK design system foundation.
   Visit /tad-preview. Everything renders inside a `.tad` root so the tokens resolve. */

function Gallery() {
  const [tab, setTab] = React.useState('vehicles');
  const [otp, setOtp] = React.useState('');
  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)', padding: 'var(--space-8)', maxWidth: 980, margin: '0 auto' }}>
      <header style={{ display: 'grid', gap: 4 }}>
        <span className="tad-eyebrow">Design system</span>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>TAD-PAK components</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Warm consumer-GPS kit · Pakistan green · pill buttons · live pulse.</p>
      </header>

      <Card title="Buttons">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Button>Start tracking</Button>
          <Button variant="secondary">View trip</Button>
          <Button variant="subtle">Share location</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Remove</Button>
          <Button loading>Saving</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <IconButton label="Locate" variant="solid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" /></svg>
          </IconButton>
        </div>
      </Card>

      <Card title="Forms">
        <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
          <Input label="Vehicle plate" placeholder="LEB-4471" mono />
          <Select label="Category" options={['Car', 'Bike', 'Person tracker']} />
          <Switch label="Notify me when it moves" defaultChecked />
          <div>
            <span className="tad-eyebrow" style={{ display: 'block', marginBottom: 8 }}>SMS code</span>
            <OTPInput value={otp} onChange={setOtp} />
          </div>
        </div>
      </Card>

      <Card title="Feedback & data">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <Badge variant="brand">New</Badge>
          <Badge variant="success" dot>Online</Badge>
          <Badge variant="warning">Idle</Badge>
          <Badge variant="danger" dot>Offline</Badge>
          <StatusDot status="moving" />
          <StatusDot status="idle" />
          <StatusDot status="offline" />
          <Tag onRemove={() => {}}>geofence</Tag>
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
          <Metric label="Distance today" value="34.2" unit="km" delta="+12%" />
          <Metric label="Active devices" value="128" delta="-3" />
        </div>
      </Card>

      <Card title="Tabs">
        <Tabs
          variant="pill"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'vehicles', label: 'Vehicles', count: 12 },
            { value: 'assets', label: 'Assets', count: 5 },
            { value: 'employees', label: 'Employees', count: 8 },
          ]}
        />
      </Card>

      <Card title="Map markers" flushBody>
        <div className="tad-dot-bg" style={{ position: 'relative', height: 220, background: 'var(--map-land)' }}>
          <MapMarker shape="arrow" status="moving" heading={40} top={30} left={25} size={34} label="Car" />
          <MapMarker shape="pin" kind="car" status="parked" top={60} left={55} label="Parked car" />
          <MapMarker shape="circle" status="idle" top={40} left={70} label="Employee" />
          <MapMarker shape="flag" status="offline" top={70} left={82} label="Incident" />
        </div>
      </Card>
    </div>
  );
}

export default function TadPreviewPage() {
  const [dark, setDark] = React.useState(false);
  return (
    <div className="tad" data-theme={dark ? 'dark' : undefined} style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 20 }}>
        <Switch label="Night" checked={dark} onChange={(e) => setDark(e.target.checked)} />
      </div>
      <Gallery />
    </div>
  );
}
