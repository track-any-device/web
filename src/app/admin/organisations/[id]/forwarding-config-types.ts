import type { OnboardingMethodDefinition, RestMethod, Transport } from './forwarding-config-sections';

export interface RestApiConfig {
  endpoint_url: string;
  method: RestMethod;
  headers: Record<string, string>;
  params: Record<string, string>;
  field_map: Record<string, string | null>;
  tenant_onboarding: string | null;
  tenant_onboarding_config: Record<string, string> | null;
}

export interface MqttConfig {
  host: string;
  port: number;
  topic: string;
  username: string;
  password_set: boolean;
  tls: boolean;
  qos: number;
  params: Record<string, string>;
  field_map: Record<string, string | null>;
  tenant_onboarding: string | null;
  tenant_onboarding_config: Record<string, string> | null;
}

export interface Health {
  lastOkAt: string | null;
  lastError: string | null;
  errorCount: number;
}

export interface ForwardingConfig {
  transport: Transport;
  enabled: boolean;
  rest_api: RestApiConfig;
  mqtt: MqttConfig;
  availableFields: string[];
  availableVariables: string[];
  // Optional: absent on API versions that predate tenant onboarding (app PR #117).
  onboardingMethods?: string[];
  onboardingMethodDefinitions?: Record<string, OnboardingMethodDefinition>;
  payloadFields: string[];
  mqttAvailable: boolean;
  health: Health;
}

export interface TestResult {
  ok: boolean;
  status?: number | string | null;
  error?: string | null;
  preview?: unknown;
  response?: unknown;
}