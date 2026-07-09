'use client';

import React from 'react';
import { Button, Card } from '@/components/ui';
import {
  MqttForwardingSection,
  RestForwardingSection,
  TransportControls,
} from './forwarding-config-sections';
import type { ForwardingConfig, TestResult } from './forwarding-config-types';
import { useForwardingConfigForm } from './use-forwarding-config-form';

/* Signal forwarding config for one tenant. Reads its own config via the BFF GET on mount, lets an
   admin pick a transport (TAD101 channel / REST API / MQTT) and edit its settings, test it, and save.

   Secrets are never returned in full — the GET sends masked values (••••ab12) and password_set/headers
   placeholders. On save we only send a header value / mqtt.password when the admin actually typed a new
   one; blank/untouched fields keep the stored secret. Real data only — nothing is fabricated. */

interface Health {
  lastOkAt: string | null;
  lastError: string | null;
  errorCount: number;
}

export function ForwardingConfig({ tenantId }: { tenantId: number | string }) {
  const [cfg, setCfg] = React.useState<ForwardingConfig | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const form = useForwardingConfigForm();

  const [busy, setBusy] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [saveOk, setSaveOk] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [test, setTest] = React.useState<TestResult | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setLoadError(null);
      try {
        const res = await fetch(`/api/admin/tenants/${tenantId}/forwarding`, { headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) { setLoadError(data?.message ?? 'Could not load the forwarding config.'); return; }
        setCfg(data as ForwardingConfig);
        form.hydrate(data as ForwardingConfig);
      } catch {
        if (alive) setLoadError('Network error — could not load the forwarding config.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tenantId, form]);

  async function save() {
    setBusy(true); setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/forwarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.buildBody()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveOk(false); setSaveMsg(data?.message ?? 'Could not save the forwarding config.'); return; }
      setSaveOk(true); setSaveMsg('Forwarding config saved.');
      if (data && typeof data === 'object' && 'transport' in data) {
        setCfg(data as ForwardingConfig);
        form.hydrate(data as ForwardingConfig);
      }
    } catch {
      setSaveOk(false); setSaveMsg('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function runTest() {
    setTesting(true); setTest(null); setShowPreview(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/forwarding/test`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setTest({ ok: false, error: data?.message ?? 'Test request failed.', status: res.status }); return; }
      setTest(data as TestResult);
    } catch {
      setTest({ ok: false, error: 'Network error — please try again.' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <Card title="Signal forwarding">
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      </Card>
    );
  }
  if (loadError || !cfg) {
    return (
      <Card title="Signal forwarding">
        <div style={{ color: 'var(--danger)', fontSize: 13 }}>{loadError ?? 'Forwarding config unavailable.'}</div>
      </Card>
    );
  }

  const fieldOptions = form.fieldOptions(cfg);
  const onboardingOptions = form.onboardingOptions(cfg);

  return (
    <Card title="Signal forwarding">
      <div style={{ display: 'grid', gap: 16 }}>
        <TransportControls
          transport={form.transport}
          setTransport={form.setTransport}
          enabled={form.enabled}
          setEnabled={form.setEnabled}
          mqttAvailable={cfg.mqttAvailable}
        />

        {form.transport === 'rest_api' && (
          <RestForwardingSection
            endpointUrl={form.endpointUrl}
            setEndpointUrl={form.setEndpointUrl}
            method={form.method}
            setMethod={form.setMethod}
            headerRows={form.headerRows}
            setHeaderRows={form.setHeaderRows}
            paramRows={form.paramRows}
            setParamRows={form.setParamRows}
            tenantOnboarding={form.restTenantOnboarding}
            setTenantOnboarding={form.setRestTenantOnboarding}
            tenantOnboardingRows={form.restTenantOnboardingRows}
            setTenantOnboardingRows={form.setRestTenantOnboardingRows}
            onboardingMethodDefinitions={cfg.onboardingMethodDefinitions}
            onboardingOptions={onboardingOptions}
            payloadFields={cfg.payloadFields}
            fieldOptions={fieldOptions}
            fieldMap={form.restFieldMap}
            setFieldMap={form.setRestFieldMap}
          />
        )}

        {form.transport === 'mqtt' && (
          <MqttForwardingSection
            mqttHost={form.mqttHost}
            setMqttHost={form.setMqttHost}
            mqttPort={form.mqttPort}
            setMqttPort={form.setMqttPort}
            mqttTopic={form.mqttTopic}
            setMqttTopic={form.setMqttTopic}
            mqttUsername={form.mqttUsername}
            setMqttUsername={form.setMqttUsername}
            mqttPassword={form.mqttPassword}
            setMqttPassword={form.setMqttPassword}
            mqttPasswordSet={form.mqttPasswordSet}
            mqttTls={form.mqttTls}
            setMqttTls={form.setMqttTls}
            mqttQos={form.mqttQos}
            setMqttQos={form.setMqttQos}
            mqttParamRows={form.mqttParamRows}
            setMqttParamRows={form.setMqttParamRows}
            tenantOnboarding={form.mqttTenantOnboarding}
            setTenantOnboarding={form.setMqttTenantOnboarding}
            tenantOnboardingRows={form.mqttTenantOnboardingRows}
            setTenantOnboardingRows={form.setMqttTenantOnboardingRows}
            onboardingMethodDefinitions={cfg.onboardingMethodDefinitions}
            onboardingOptions={onboardingOptions}
            payloadFields={cfg.payloadFields}
            fieldOptions={fieldOptions}
            fieldMap={form.mqttFieldMap}
            setFieldMap={form.setMqttFieldMap}
          />
        )}

        {/* Health */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2, var(--bg-subtle))', fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Last delivery OK: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{relTime(cfg.health?.lastOkAt)}</span></span>
          <span style={{ color: 'var(--text-muted)' }}>Errors: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{cfg.health?.errorCount ?? 0}</span></span>
          {cfg.health?.lastError && (
            <span style={{ color: 'var(--danger)' }}>Last error: {cfg.health.lastError}</span>
          )}
        </div>

        {/* Test result */}
        {test && (
          <div style={{ fontSize: 13 }}>
            <div style={{ color: test.ok ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {test.ok ? 'Test delivered' : 'Test failed'}
              {test.status != null && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {String(test.status)}</span>}
            </div>
            {test.error && <div style={{ color: 'var(--danger)', marginTop: 4 }}>{test.error}</div>}
            {test.preview != null && (
              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={() => setShowPreview((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {showPreview ? 'Hide payload preview' : 'Show payload preview'}
                </button>
                {showPreview && (
                  <pre style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'var(--surface-2, var(--bg-subtle))', fontFamily: 'var(--font-mono)', fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(test.preview, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={save} loading={busy} disabled={busy}>Save</Button>
          <Button variant="secondary" onClick={runTest} loading={testing} disabled={testing}>Test</Button>
          {saveMsg && <span style={{ fontSize: 13, color: saveOk ? 'var(--success)' : 'var(--danger)' }}>{saveMsg}</span>}
        </div>
      </div>
    </Card>
  );
}

function relTime(ts?: string | null): string {
  if (!ts) return 'never';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
