'use client';

import React from 'react';
import {
  buildFieldMap,
  buildOnboardingConfig,
  type FieldMapRow,
  type KVRow,
  NOT_SENT,
  type RestMethod,
  toFieldMapRows,
  toOnboardingRows,
  toRows,
  type Transport,
} from './forwarding-config-sections';
import type { ForwardingConfig } from './forwarding-config-types';

export function useForwardingConfigForm() {
  const [transport, setTransport] = React.useState<Transport>('tad101_channel');
  const [enabled, setEnabled] = React.useState(false);

  const [endpointUrl, setEndpointUrl] = React.useState('');
  const [method, setMethod] = React.useState<RestMethod>('POST');
  const [headerRows, setHeaderRows] = React.useState<KVRow[]>([]);
  const [paramRows, setParamRows] = React.useState<KVRow[]>([]);
  const [restFieldMapRows, setRestFieldMapRows] = React.useState<FieldMapRow[]>([]);
  const [restTenantOnboarding, setRestTenantOnboarding] = React.useState('');
  const [restTenantOnboardingRows, setRestTenantOnboardingRows] = React.useState<KVRow[]>([]);

  const [mqttHost, setMqttHost] = React.useState('');
  const [mqttPort, setMqttPort] = React.useState('');
  const [mqttTopic, setMqttTopic] = React.useState('');
  const [mqttUsername, setMqttUsername] = React.useState('');
  const [mqttPassword, setMqttPassword] = React.useState('');
  const [mqttPasswordSet, setMqttPasswordSet] = React.useState(false);
  const [mqttTls, setMqttTls] = React.useState(false);
  const [mqttQos, setMqttQos] = React.useState('0');
  const [mqttParamRows, setMqttParamRows] = React.useState<KVRow[]>([]);
  const [mqttFieldMapRows, setMqttFieldMapRows] = React.useState<FieldMapRow[]>([]);
  const [mqttTenantOnboarding, setMqttTenantOnboarding] = React.useState('');
  const [mqttTenantOnboardingRows, setMqttTenantOnboardingRows] = React.useState<KVRow[]>([]);

  const hydrate = React.useCallback((cfg: ForwardingConfig) => {
    setTransport(cfg.transport ?? 'tad101_channel');
    setEnabled(!!cfg.enabled);

    setEndpointUrl(cfg.rest_api?.endpoint_url ?? '');
    setMethod((cfg.rest_api?.method as RestMethod) ?? 'POST');
    setHeaderRows(toRows(cfg.rest_api?.headers ?? {}, true));
    setParamRows(toRows(cfg.rest_api?.params ?? {}, false));
    setRestFieldMapRows(toFieldMapRows(cfg.rest_api?.field_map ?? {}));
    setRestTenantOnboarding(cfg.rest_api?.tenant_onboarding ?? '');
    setRestTenantOnboardingRows(toOnboardingRows(
      cfg.rest_api?.tenant_onboarding_config ?? {},
      cfg.onboardingMethodDefinitions?.[cfg.rest_api?.tenant_onboarding ?? ''],
    ));

    setMqttHost(cfg.mqtt?.host ?? '');
    setMqttPort(cfg.mqtt?.port != null ? String(cfg.mqtt.port) : '');
    setMqttTopic(cfg.mqtt?.topic ?? '');
    setMqttUsername(cfg.mqtt?.username ?? '');
    setMqttPasswordSet(!!cfg.mqtt?.password_set);
    setMqttPassword('');
    setMqttTls(!!cfg.mqtt?.tls);
    setMqttQos(cfg.mqtt?.qos != null ? String(cfg.mqtt.qos) : '0');
    setMqttParamRows(toRows(cfg.mqtt?.params ?? {}, false));
    setMqttFieldMapRows(toFieldMapRows(cfg.mqtt?.field_map ?? {}));
    setMqttTenantOnboarding(cfg.mqtt?.tenant_onboarding ?? '');
    setMqttTenantOnboardingRows(toOnboardingRows(
      cfg.mqtt?.tenant_onboarding_config ?? {},
      cfg.onboardingMethodDefinitions?.[cfg.mqtt?.tenant_onboarding ?? ''],
    ));
  }, []);

  const buildBody = React.useCallback(() => {
    const body: Record<string, unknown> = { transport, enabled };

    if (transport === 'rest_api') {
      const headers: Record<string, string> = {};
      for (const row of headerRows) {
        const key = row.key.trim();
        if (!key) continue;
        if (row.dirty && row.value) headers[key] = row.value;
        else if (!row.masked) headers[key] = row.value;
      }

      const params: Record<string, string> = {};
      for (const row of paramRows) {
        const key = row.key.trim();
        if (key) params[key] = row.value;
      }

      body.rest_api = {
        endpoint_url: endpointUrl.trim(),
        method,
        headers,
        params,
        field_map: buildFieldMap(restFieldMapRows),
        tenant_onboarding: restTenantOnboarding || null,
        tenant_onboarding_config: buildOnboardingConfig(restTenantOnboardingRows),
      };
    }

    if (transport === 'mqtt') {
      const params: Record<string, string> = {};
      for (const row of mqttParamRows) {
        const key = row.key.trim();
        if (key) params[key] = row.value;
      }

      const mqtt: Record<string, unknown> = {
        host: mqttHost.trim(),
        port: mqttPort.trim() ? Number(mqttPort) : null,
        topic: mqttTopic.trim(),
        username: mqttUsername.trim(),
        tls: mqttTls,
        qos: Number(mqttQos),
        params,
        field_map: buildFieldMap(mqttFieldMapRows),
        tenant_onboarding: mqttTenantOnboarding || null,
        tenant_onboarding_config: buildOnboardingConfig(mqttTenantOnboardingRows),
      };

      if (mqttPassword) mqtt.password = mqttPassword;
      body.mqtt = mqtt;
    }

    return body;
  }, [
    enabled,
    endpointUrl,
    headerRows,
    method,
    mqttFieldMapRows,
    mqttHost,
    mqttParamRows,
    mqttPassword,
    mqttPort,
    mqttQos,
    mqttTenantOnboarding,
    mqttTenantOnboardingRows,
    mqttTls,
    mqttTopic,
    mqttUsername,
    paramRows,
    restFieldMapRows,
    restTenantOnboarding,
    restTenantOnboardingRows,
    transport,
  ]);

  const fieldOptions = React.useCallback((cfg: ForwardingConfig) => [
    { value: NOT_SENT, label: '— not sent —' },
    ...cfg.availableFields.map((field) => ({ value: field, label: field })),
  ], []);

  // onboardingMethods is absent on API versions that predate tenant onboarding — degrade to "None".
  const onboardingOptions = React.useCallback((cfg: ForwardingConfig) => [
    { value: '', label: 'None' },
    ...(cfg.onboardingMethods ?? []).map((methodName) => ({
      value: methodName,
      label: cfg.onboardingMethodDefinitions?.[methodName]?.label ?? methodName,
    })),
  ], []);

  return {
    transport,
    setTransport,
    enabled,
    setEnabled,
    endpointUrl,
    setEndpointUrl,
    method,
    setMethod,
    headerRows,
    setHeaderRows,
    paramRows,
    setParamRows,
    restFieldMapRows,
    setRestFieldMapRows,
    restTenantOnboarding,
    setRestTenantOnboarding,
    restTenantOnboardingRows,
    setRestTenantOnboardingRows,
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
    setMqttPasswordSet,
    mqttTls,
    setMqttTls,
    mqttQos,
    setMqttQos,
    mqttParamRows,
    setMqttParamRows,
    mqttFieldMapRows,
    setMqttFieldMapRows,
    mqttTenantOnboarding,
    setMqttTenantOnboarding,
    mqttTenantOnboardingRows,
    setMqttTenantOnboardingRows,
    hydrate,
    buildBody,
    fieldOptions,
    onboardingOptions,
  };
}