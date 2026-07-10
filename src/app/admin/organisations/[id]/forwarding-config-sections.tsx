'use client';

import React from 'react';
import { Button, Input, Select, Switch } from '@/components/ui';

export type Transport = 'tad101_channel' | 'rest_api' | 'mqtt';
export type RestMethod = 'POST' | 'PUT' | 'PATCH';

export interface OnboardingFieldDefinition {
  key: string;
  label: string;
  type: 'url' | 'secret' | 'text';
  required?: boolean;
}

export interface OnboardingMethodDefinition {
  label: string;
  fields: OnboardingFieldDefinition[];
}

export type KVRow = { id: number; key: string; value: string; masked: string; dirty: boolean };

/** One field-map row — external payload key → platform source (null = sent as null). */
export type FieldMapRow = { id: number; key: string; source: string | null };

export const TRANSPORTS: { value: Transport; label: string }[] = [
  { value: 'tad101_channel', label: 'TAD101 channel (default)' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'mqtt', label: 'MQTT' },
];

export const NOT_SENT = '__not_sent__';

let rowSeq = 0;

export function toRows(map: Record<string, string>, secret: boolean): KVRow[] {
  return Object.entries(map ?? {}).map(([key, val]) => secret
    ? { id: rowSeq++, key, value: '', masked: String(val ?? ''), dirty: false }
    : { id: rowSeq++, key, value: String(val ?? ''), masked: '', dirty: true });
}

export function toOnboardingRows(config: Record<string, string>, definition?: OnboardingMethodDefinition): KVRow[] {
  if (!definition) return [];

  return definition.fields.map((field) => {
    const raw = String(config?.[field.key] ?? '');
    const secret = field.type === 'secret';

    return {
      id: rowSeq++,
      key: field.key,
      value: secret ? '' : raw,
      masked: secret ? raw : '',
      dirty: !secret,
    };
  });
}

export function toFieldMapRows(map: Record<string, string | null>): FieldMapRow[] {
  return Object.entries(map ?? {}).map(([key, source]) => ({ id: rowSeq++, key, source: source ?? null }));
}

export function buildFieldMap(rows: FieldMapRow[]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) out[key] = row.source;
  }
  return out;
}

export function buildOnboardingConfig(rows: KVRow[]): Record<string, string> | null {
  const config: Record<string, string> = {};

  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    if (row.dirty && row.value) config[key] = row.value;
    else if (!row.masked) config[key] = row.value;
    else config[key] = '';
  }

  return Object.keys(config).length > 0 ? config : null;
}

export function TransportControls({
  transport,
  setTransport,
  enabled,
  setEnabled,
  mqttAvailable,
}: {
  transport: Transport;
  setTransport: (transport: Transport) => void;
  enabled: boolean;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  mqttAvailable: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 220 }}>
        <Select label="Transport" value={transport} onChange={(e) => setTransport(e.target.value as Transport)}>
          {TRANSPORTS.map((t) => (
            <option key={t.value} value={t.value} disabled={t.value === 'mqtt' && !mqttAvailable}>
              {t.label}
            </option>
          ))}
        </Select>
        {transport === 'mqtt' && !mqttAvailable && (
          <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 6 }}>Pending server dependency</div>
        )}
      </div>
      <Switch label="Enabled" checked={enabled} onChange={() => setEnabled((v) => !v)} />
    </div>
  );
}

export function RestForwardingSection({
  endpointUrl,
  setEndpointUrl,
  method,
  setMethod,
  headerRows,
  setHeaderRows,
  paramRows,
  setParamRows,
  tenantOnboarding,
  setTenantOnboarding,
  tenantOnboardingRows,
  setTenantOnboardingRows,
  onboardingMethodDefinitions,
  onboardingOptions,
  availableVariables,
  fieldOptions,
  fieldMapRows,
  setFieldMapRows,
}: {
  endpointUrl: string;
  setEndpointUrl: (value: string) => void;
  method: RestMethod;
  setMethod: (value: RestMethod) => void;
  headerRows: KVRow[];
  setHeaderRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  paramRows: KVRow[];
  setParamRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  tenantOnboarding: string;
  setTenantOnboarding: (value: string) => void;
  tenantOnboardingRows: KVRow[];
  setTenantOnboardingRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  onboardingMethodDefinitions: Record<string, OnboardingMethodDefinition>;
  onboardingOptions: { value: string; label: string }[];
  availableVariables: string[];
  fieldOptions: { value: string; label: string }[];
  fieldMapRows: FieldMapRow[];
  setFieldMapRows: React.Dispatch<React.SetStateAction<FieldMapRow[]>>;
}) {
  const definition = onboardingMethodDefinitions[tenantOnboarding];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 240 }}>
          <Input label="Endpoint URL" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://example.com/webhook" />
        </div>
        <div style={{ minWidth: 120 }}>
          <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as RestMethod)} options={['POST', 'PUT', 'PATCH']} />
        </div>
      </div>
      <VariableHints variables={availableVariables} note="Usable in the endpoint URL, header values, and param values — substituted at send time:" />

      <KVEditor
        title="Headers"
        note="Values are secret — leave blank to keep the stored value."
        rows={headerRows}
        setRows={setHeaderRows}
        secret
      />

      <OnboardingSection
        label="Device tenant auth / onboarding"
        method={tenantOnboarding}
        onMethodChange={setTenantOnboarding}
        methodDefinitions={onboardingMethodDefinitions}
        methodOptions={onboardingOptions}
        definition={definition}
        rows={tenantOnboardingRows}
        setRows={setTenantOnboardingRows}
      />

      <KVEditor
        title="Params"
        note="Static constants added to every payload — values may use the template variables above."
        rows={paramRows}
        setRows={setParamRows}
      />

      <FieldMap options={fieldOptions} rows={fieldMapRows} setRows={setFieldMapRows} />
    </div>
  );
}

export function MqttForwardingSection({
  mqttHost,
  setMqttHost,
  mqttPort,
  setMqttPort,
  mqttTopic,
  setMqttTopic,
  mqttUsername,
  setMqttUsername,
  mqttPassword,
  setMqttPassword,
  mqttPasswordSet,
  mqttTls,
  setMqttTls,
  mqttQos,
  setMqttQos,
  mqttParamRows,
  setMqttParamRows,
  tenantOnboarding,
  setTenantOnboarding,
  tenantOnboardingRows,
  setTenantOnboardingRows,
  onboardingMethodDefinitions,
  onboardingOptions,
  availableVariables,
  fieldOptions,
  fieldMapRows,
  setFieldMapRows,
}: {
  mqttHost: string;
  setMqttHost: (value: string) => void;
  mqttPort: string;
  setMqttPort: (value: string) => void;
  mqttTopic: string;
  setMqttTopic: (value: string) => void;
  mqttUsername: string;
  setMqttUsername: (value: string) => void;
  mqttPassword: string;
  setMqttPassword: (value: string) => void;
  mqttPasswordSet: boolean;
  mqttTls: boolean;
  setMqttTls: React.Dispatch<React.SetStateAction<boolean>>;
  mqttQos: string;
  setMqttQos: (value: string) => void;
  mqttParamRows: KVRow[];
  setMqttParamRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  tenantOnboarding: string;
  setTenantOnboarding: (value: string) => void;
  tenantOnboardingRows: KVRow[];
  setTenantOnboardingRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  onboardingMethodDefinitions: Record<string, OnboardingMethodDefinition>;
  onboardingOptions: { value: string; label: string }[];
  availableVariables: string[];
  fieldOptions: { value: string; label: string }[];
  fieldMapRows: FieldMapRow[];
  setFieldMapRows: React.Dispatch<React.SetStateAction<FieldMapRow[]>>;
}) {
  const definition = onboardingMethodDefinitions[tenantOnboarding];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <Input label="Host" value={mqttHost} onChange={(e) => setMqttHost(e.target.value)} placeholder="broker.example.com" />
        </div>
        <div style={{ minWidth: 110 }}>
          <Input label="Port" type="number" value={mqttPort} onChange={(e) => setMqttPort(e.target.value)} placeholder="8883" />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <Input label="Topic" value={mqttTopic} onChange={(e) => setMqttTopic(e.target.value)} placeholder="tad/{tenant_slug}/signals" />
        <VariableHints variables={availableVariables} note="Usable in the topic and param values — substituted at send time:" />
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

      <OnboardingSection
        label="Device tenant auth / onboarding"
        method={tenantOnboarding}
        onMethodChange={setTenantOnboarding}
        methodDefinitions={onboardingMethodDefinitions}
        methodOptions={onboardingOptions}
        definition={definition}
        rows={tenantOnboardingRows}
        setRows={setTenantOnboardingRows}
        hint="Tech impliment onboarding still uses HTTP endpoints even when live signal delivery uses MQTT."
      />

      <KVEditor
        title="Params"
        note="Static constants added to every payload — values may use the template variables above."
        rows={mqttParamRows}
        setRows={setMqttParamRows}
      />

      <FieldMap options={fieldOptions} rows={fieldMapRows} setRows={setFieldMapRows} />
    </div>
  );
}

function KVEditor({
  title, note, rows, setRows, secret = false, fieldMeta,
}: {
  title: string;
  note: string;
  rows: KVRow[];
  setRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  secret?: boolean;
  fieldMeta?: Record<string, OnboardingFieldDefinition>;
}) {
  function update(id: number, patch: Partial<KVRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const locked = fieldMeta !== undefined;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{note}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <Input value={r.key} onChange={(e) => update(r.id, { key: e.target.value })} placeholder="Key" disabled={locked} hint={fieldMeta?.[r.key]?.required ? 'Required' : undefined} />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <Input
                type={(fieldMeta?.[r.key]?.type === 'secret' || secret) ? 'password' : fieldMeta?.[r.key]?.type === 'url' ? 'url' : 'text'}
                value={r.value}
                onChange={(e) => update(r.id, { value: e.target.value, dirty: true })}
                placeholder={(fieldMeta?.[r.key]?.type === 'secret' || secret) && r.masked ? r.masked : 'Value'}
              />
            </div>
            {!locked && <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>Remove</Button>}
          </div>
        ))}
      </div>
      {!locked && (
        <div style={{ marginTop: 8 }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, { id: rowSeq++, key: '', value: '', masked: '', dirty: true }])}>
            Add row
          </Button>
        </div>
      )}
    </div>
  );
}

function OnboardingSection({
  label,
  method,
  onMethodChange,
  methodDefinitions,
  methodOptions,
  definition,
  rows,
  setRows,
  hint,
}: {
  label: string;
  method: string;
  onMethodChange: (value: string) => void;
  methodDefinitions: Record<string, OnboardingMethodDefinition>;
  methodOptions: { value: string; label: string }[];
  definition?: OnboardingMethodDefinition;
  rows: KVRow[];
  setRows: React.Dispatch<React.SetStateAction<KVRow[]>>;
  hint?: string;
}) {
  return (
    <div style={{ display: 'grid', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2, var(--bg-subtle))' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220 }}>
          <Select
            label={label}
            value={method}
            onChange={(e) => {
              const next = e.target.value;
              onMethodChange(next);
              setRows(toOnboardingRows({}, methodDefinitions[next]));
            }}
            options={methodOptions}
          />
        </div>
      </div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</div>}
      {method && definition && (
        <KVEditor
          title={`${definition.label} settings`}
          note="These endpoints and auth settings are used only for device onboarding. No body editing is required here."
          rows={rows}
          setRows={setRows}
          fieldMeta={Object.fromEntries(definition.fields.map((field) => [field.key, field]))}
        />
      )}
    </div>
  );
}

/** All template variables the platform substitutes at send time, rendered as code chips. */
function VariableHints({ variables, note }: { variables: string[]; note: string }) {
  if (!variables.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
      <span>{note}</span>
      {variables.map((v) => (
        <code
          key={v}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'var(--surface-2, var(--bg-subtle))', color: 'var(--text-secondary)' }}
        >
          {v}
        </code>
      ))}
    </div>
  );
}

function FieldMap({
  options, rows, setRows,
}: {
  options: { value: string; label: string }[];
  rows: FieldMapRow[];
  setRows: React.Dispatch<React.SetStateAction<FieldMapRow[]>>;
}) {
  function update(id: number, patch: Partial<FieldMapRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Field map</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        External payload keys and the platform value each one carries — rename, remove, or add keys to match what your system expects.
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <Input
                value={r.key}
                onChange={(e) => update(r.id, { key: e.target.value })}
                placeholder="Payload key"
                hint={r.key === 'Humidity' ? 'Not available from current devices.' : undefined}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <Select
                value={r.source ?? NOT_SENT}
                onChange={(e) => update(r.id, { source: e.target.value === NOT_SENT ? null : e.target.value })}
                options={options}
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>Remove</Button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <Button type="button" variant="secondary" size="sm" onClick={() => setRows((rs) => [...rs, { id: rowSeq++, key: '', source: null }])}>
          Add field
        </Button>
      </div>
    </div>
  );
}