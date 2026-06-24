'use client';

import React from 'react';
import { Button, Card, Input, Select, Switch } from '@/components/ui';

/* Signal forwarding config for one tenant. Reads its own config via the BFF GET on mount, lets an
   admin pick a transport (TAD101 channel / REST API / MQTT) and edit its settings, test it, and save.

   Secrets are never returned in full — the GET sends masked values (••••ab12) and password_set/headers
   placeholders. On save we only send a header value / mqtt.password when the admin actually typed a new
   one; blank/untouched fields keep the stored secret. Real data only — nothing is fabricated. */

type Transport = 'tad101_channel' | 'rest_api' | 'mqtt';
type RestMethod = 'POST' | 'PUT' | 'PATCH';

interface RestApiConfig {
  endpoint_url: string;
  method: RestMethod;
  headers: Record<string, string>;
  params: Record<string, string>;
  field_map: Record<string, string | null>;
}
interface MqttConfig {
  host: string;
  port: number;
  topic: string;
  username: string;
  password_set: boolean;
  tls: boolean;
  qos: number;
  field_map: Record<string, string | null>;
}
interface Health {
  lastOkAt: string | null;
  lastError: string | null;
  errorCount: number;
}
interface ForwardingConfig {
  transport: Transport;
  enabled: boolean;
  rest_api: RestApiConfig;
  mqtt: MqttConfig;
  availableFields: string[];
  payloadFields: string[];
  mqttAvailable: boolean;
  health: Health;
}

interface TestResult {
  ok: boolean;
  status?: number | string | null;
  error?: string | null;
  preview?: unknown;
  response?: unknown;
}

// A header/param row in the editor. `masked` is the placeholder shown for an existing secret; `value`
// holds a newly-typed value (only sent when non-empty); `dirty` flags that the admin changed it.
type KVRow = { id: number; key: string; value: string; masked: string; dirty: boolean };

const TRANSPORTS: { value: Transport; label: string }[] = [
  { value: 'tad101_channel', label: 'TAD101 channel (default)' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'mqtt', label: 'MQTT' },
];

const NOT_SENT = '__not_sent__';

let rowSeq = 0;
function toRows(map: Record<string, string>, secret: boolean): KVRow[] {
  return Object.entries(map ?? {}).map(([key, val]) => secret
    // header: the value comes back masked — keep it as a placeholder, leave the editable value blank
    ? { id: rowSeq++, key, value: '', masked: String(val ?? ''), dirty: false }
    // param: not secret — the live value is editable and always sent
    : { id: rowSeq++, key, value: String(val ?? ''), masked: '', dirty: true });
}

export function ForwardingConfig({ tenantId }: { tenantId: number | string }) {
  const [cfg, setCfg] = React.useState<ForwardingConfig | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [transport, setTransport] = React.useState<Transport>('tad101_channel');
  const [enabled, setEnabled] = React.useState(false);

  // REST
  const [endpointUrl, setEndpointUrl] = React.useState('');
  const [method, setMethod] = React.useState<RestMethod>('POST');
  const [headerRows, setHeaderRows] = React.useState<KVRow[]>([]);
  const [paramRows, setParamRows] = React.useState<KVRow[]>([]);
  const [restFieldMap, setRestFieldMap] = React.useState<Record<string, string | null>>({});

  // MQTT
  const [mqttHost, setMqttHost] = React.useState('');
  const [mqttPort, setMqttPort] = React.useState('');
  const [mqttTopic, setMqttTopic] = React.useState('');
  const [mqttUsername, setMqttUsername] = React.useState('');
  const [mqttPassword, setMqttPassword] = React.useState('');
  const [mqttPasswordSet, setMqttPasswordSet] = React.useState(false);
  const [mqttTls, setMqttTls] = React.useState(false);
  const [mqttQos, setMqttQos] = React.useState('0');
  const [mqttFieldMap, setMqttFieldMap] = React.useState<Record<string, string | null>>({});

  const [busy, setBusy] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [saveOk, setSaveOk] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [test, setTest] = React.useState<TestResult | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  // Hydrate local state from a freshly-fetched config.
  const hydrate = React.useCallback((c: ForwardingConfig) => {
    setCfg(c);
    setTransport(c.transport ?? 'tad101_channel');
    setEnabled(!!c.enabled);
    setEndpointUrl(c.rest_api?.endpoint_url ?? '');
    setMethod((c.rest_api?.method as RestMethod) ?? 'POST');
    setHeaderRows(toRows(c.rest_api?.headers ?? {}, true));
    setParamRows(toRows(c.rest_api?.params ?? {}, false));
    setRestFieldMap(c.rest_api?.field_map ?? {});
    setMqttHost(c.mqtt?.host ?? '');
    setMqttPort(c.mqtt?.port != null ? String(c.mqtt.port) : '');
    setMqttTopic(c.mqtt?.topic ?? '');
    setMqttUsername(c.mqtt?.username ?? '');
    setMqttPasswordSet(!!c.mqtt?.password_set);
    setMqttPassword('');
    setMqttTls(!!c.mqtt?.tls);
    setMqttQos(c.mqtt?.qos != null ? String(c.mqtt.qos) : '0');
    setMqttFieldMap(c.mqtt?.field_map ?? {});
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setLoadError(null);
      try {
        const res = await fetch(`/api/admin/tenants/${tenantId}/forwarding`, { headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) { setLoadError(data?.message ?? 'Could not load the forwarding config.'); return; }
        hydrate(data as ForwardingConfig);
      } catch {
        if (alive) setLoadError('Network error — could not load the forwarding config.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tenantId, hydrate]);

  function buildBody() {
    const body: Record<string, unknown> = { transport, enabled };
    if (transport === 'rest_api') {
      const headers: Record<string, string> = {};
      for (const r of headerRows) {
        const k = r.key.trim();
        if (!k) continue;
        // Only send a value when the admin typed a new one; otherwise omit so the stored secret is kept.
        if (r.dirty && r.value) headers[k] = r.value;
        else if (!r.masked) headers[k] = r.value;
      }
      const params: Record<string, string> = {};
      for (const r of paramRows) {
        const k = r.key.trim();
        if (k) params[k] = r.value;
      }
      body.rest_api = { endpoint_url: endpointUrl.trim(), method, headers, params, field_map: restFieldMap };
    } else if (transport === 'mqtt') {
      const mqtt: Record<string, unknown> = {
        host: mqttHost.trim(),
        port: mqttPort.trim() ? Number(mqttPort) : null,
        topic: mqttTopic.trim(),
        username: mqttUsername.trim(),
        tls: mqttTls,
        qos: Number(mqttQos),
        field_map: mqttFieldMap,
      };
      // Only send a password when changed; omit to keep the stored secret.
      if (mqttPassword) mqtt.password = mqttPassword;
      body.mqtt = mqtt;
    }
    return body;
  }

  async function save() {
    setBusy(true); setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/forwarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveOk(false); setSaveMsg(data?.message ?? 'Could not save the forwarding config.'); return; }
      setSaveOk(true); setSaveMsg('Forwarding config saved.');
      if (data && typeof data === 'object' && 'transport' in data) hydrate(data as ForwardingConfig);
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

  const fieldOptions = [{ value: NOT_SENT, label: '— not sent —' }, ...cfg.availableFields.map((f) => ({ value: f, label: f }))];

  return (
    <Card title="Signal forwarding">
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Transport + enabled */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 220 }}>
            <Select
              label="Transport"
              value={transport}
              onChange={(e) => setTransport(e.target.value as Transport)}
            >
              {TRANSPORTS.map((t) => (
                <option key={t.value} value={t.value} disabled={t.value === 'mqtt' && !cfg.mqttAvailable}>
                  {t.label}
                </option>
              ))}
            </Select>
            {transport === 'mqtt' && !cfg.mqttAvailable && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 6 }}>Pending server dependency</div>
            )}
          </div>
          <Switch label="Enabled" checked={enabled} onChange={() => setEnabled((v) => !v)} />
        </div>

        {/* REST API */}
        {transport === 'rest_api' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 240 }}>
                <Input label="Endpoint URL" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://example.com/webhook" />
              </div>
              <div style={{ minWidth: 120 }}>
                <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as RestMethod)} options={['POST', 'PUT', 'PATCH']} />
              </div>
            </div>

            <KVEditor
              title="Headers"
              note="Values are secret — leave blank to keep the stored value."
              rows={headerRows}
              setRows={setHeaderRows}
              secret
            />

            <KVEditor
              title="Params"
              note="Static constants added to every payload."
              rows={paramRows}
              setRows={setParamRows}
            />

            <FieldMap
              payloadFields={cfg.payloadFields}
              options={fieldOptions}
              value={restFieldMap}
              onChange={setRestFieldMap}
            />
          </div>
        )}

        {/* MQTT */}
        {transport === 'mqtt' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <Input label="Host" value={mqttHost} onChange={(e) => setMqttHost(e.target.value)} placeholder="broker.example.com" />
              </div>
              <div style={{ minWidth: 110 }}>
                <Input label="Port" type="number" value={mqttPort} onChange={(e) => setMqttPort(e.target.value)} placeholder="8883" />
              </div>
            </div>
            <div>
              <Input label="Topic" value={mqttTopic} onChange={(e) => setMqttTopic(e.target.value)} placeholder="tad/{tenant_slug}/signals" hint="{tenant_slug} is substituted at send time." />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <Input label="Username" value={mqttUsername} onChange={(e) => setMqttUsername(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <Input label="Password" type="password" value={mqttPassword} onChange={(e) => setMqttPassword(e.target.value)} placeholder={mqttPasswordSet ? '•••• set' : ''} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Switch label="TLS" checked={mqttTls} onChange={() => setMqttTls((v) => !v)} />
              <div style={{ minWidth: 110 }}>
                <Select label="QoS" value={mqttQos} onChange={(e) => setMqttQos(e.target.value)} options={['0', '1', '2']} />
              </div>
            </div>

            <FieldMap
              payloadFields={cfg.payloadFields}
              options={fieldOptions}
              value={mqttFieldMap}
              onChange={setMqttFieldMap}
            />
          </div>
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

/* Key/value editor with add/remove rows. When `secret`, values are password inputs and the stored
   value is shown only as a masked placeholder (so a secret is visibly set without revealing it). */
function KVEditor({
  title, note, rows, setRows, secret = false,
}: {
  title: string;
  note: string;
  rows: KVRow[];
  setRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  secret?: boolean;
}) {
  function update(id: number, patch: Partial<KVRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{note}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <Input value={r.key} onChange={(e) => update(r.id, { key: e.target.value })} placeholder="Key" />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <Input
                type={secret ? 'password' : 'text'}
                value={r.value}
                onChange={(e) => update(r.id, { value: e.target.value, dirty: true })}
                placeholder={secret && r.masked ? r.masked : 'Value'}
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>Remove</Button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Button type="button" variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, { id: rowSeq++, key: '', value: '', masked: '', dirty: true }])}>
          Add row
        </Button>
      </div>
    </div>
  );
}

/* Field map: one row per payload field, mapping it to an available device field (or — not sent —). */
function FieldMap({
  payloadFields, options, value, onChange,
}: {
  payloadFields: string[];
  options: { value: string; label: string }[];
  value: Record<string, string | null>;
  onChange: (next: Record<string, string | null>) => void;
}) {
  function set(field: string, picked: string) {
    onChange({ ...value, [field]: picked === NOT_SENT ? null : picked });
  }
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Field map</div>
      <div className="tad-table-scroll">
      <table className="tad-table">
        <tbody>
          {payloadFields.map((field) => {
            const current = value[field] ?? NOT_SENT;
            return (
              <tr key={field}>
                <td style={{ fontWeight: 600 }}>
                  {field}
                  {field === 'Humidity' && (
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>Not available from current devices.</span>
                  )}
                </td>
                <td style={{ width: 260 }}>
                  <Select size="sm" value={current} onChange={(e) => set(field, e.target.value)} options={options} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
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
