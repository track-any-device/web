import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Tenant API Manual | Track Any Device' };

function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight border-b border-border pb-2">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
    return <h3 className="mt-6 mb-2 text-base font-semibold">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
    return <p className="text-sm leading-7 text-muted-foreground">{children}</p>;
}
function Li({ children }: { children: React.ReactNode }) {
    return <li className="text-sm leading-7 text-muted-foreground">{children}</li>;
}
function Code({ children }: { children: React.ReactNode }) {
    return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
    return (
        <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/60 px-4 py-3 font-mono text-xs leading-relaxed">
            {children}
        </pre>
    );
}
function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
    const colours: Record<string, string> = {
        GET:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        POST:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return (
        <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${colours[method] ?? 'bg-muted text-muted-foreground'}`}>
                {method}
            </span>
            <div>
                <code className="font-mono text-xs">{path}</code>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

export default function TenantApiManual() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <span>Tenant API Manual</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 3 — API Reference</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Tenant API Manual</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    REST endpoints, authentication, and real-time channels for building custom integrations on top of a tenant&apos;s data.
                </p>
            </header>

            <H2>Overview</H2>
            <P>The Tenant Portal API is a JSON REST API served by the central platform at <Code>https://api.your-domain.com/api/portal/</Code>. It gives authorised tenant portal applications machine-level access to devices, incidents, beats, and assignees — all automatically scoped to the tenant.</P>
            <P>This API is consumed internally by the <Code>server-tenant</Code> container but can also be used by custom dashboards, mobile apps, or backend integrations built for a specific tenant.</P>

            <H2>Authentication</H2>
            <P>Every request requires two headers:</P>
            <Pre>{`Authorization: Bearer {APP_TENANT_API_KEY}
X-Tenant-Id:   {APP_TENANT_ID}`}</Pre>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>APP_TENANT_API_KEY</strong> — the machine API key issued when the tenant was approved. Shown once in the admin panel under Portal API Keys. Stored hashed server-side.</Li>
                <Li><strong>APP_TENANT_ID</strong> — the tenant&apos;s numeric database ID, visible in the admin panel.</Li>
            </ul>
            <P>Both headers are validated on every request. The tenant context is set from the API key — all queries are automatically scoped to that tenant&apos;s data. There is no cross-tenant data access possible.</P>
            <H3>Optional: user attribution</H3>
            <P>To attribute actions to a specific user (for audit trails), include the user&apos;s Passport access token:</P>
            <Pre>{`X-User-Token: {user_passport_access_token}`}</Pre>

            <H2>Base URL</H2>
            <Pre>{`https://api.your-domain.com/api/portal/`}</Pre>

            <H2>Endpoints</H2>

            <H3>Devices</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/devices" description="List all devices for the tenant. Supports ?search= and ?status= filters. Paginated (50 per page)." />
                <Endpoint method="GET" path="/devices/{id}" description="Get a single device with device type, current assignment, and beat." />
                <Endpoint method="GET" path="/devices/{id}/signals" description="Get the latest signal snapshot (lat, lon, speed, battery, timestamp)." />
            </div>

            <H3>Incidents</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET"   path="/incidents"     description="List incidents. Supports ?status= and ?device_id= filters. Paginated (50 per page)." />
                <Endpoint method="GET"   path="/incidents/{id}" description="Get a single incident with device, assignee, and beat details." />
                <Endpoint method="POST"  path="/incidents"      description="Create a new incident manually." />
                <Endpoint method="PATCH" path="/incidents/{id}" description="Update incident status (open, acknowledged, escalated, resolved) and resolution notes." />
            </div>

            <H3>Beats</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/beats"     description="List all top-level beats (inclusion and exclusion zones) with children and supervisor." />
                <Endpoint method="GET" path="/beats/{id}" description="Get a single beat with assigned devices." />
            </div>

            <H3>Assignees</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/assignees"     description="List all assignees with type and current device assignment." />
                <Endpoint method="GET" path="/assignees/{id}" description="Get a single assignee with beat assignments." />
            </div>

            <H3>Real-time (WebSocket auth)</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="POST" path="/broadcasting/auth" description="Sign a Pusher/Soketi private channel auth response. Required for real-time device location updates." />
            </div>

            <H2>Response Format</H2>
            <P>All endpoints return JSON. Lists return paginated objects:</P>
            <Pre>{`{
  "data":         [...],
  "total":        142,
  "current_page": 1,
  "last_page":    3,
  "per_page":     50
}`}</Pre>
            <P>Single resources return the object directly. Errors follow Laravel&apos;s standard JSON error format with <Code>message</Code> and optional <Code>errors</Code> keys.</P>

            <H2>Real-time — Soketi WebSocket</H2>
            <P>Device positions stream in real time via Soketi (Pusher-compatible WebSocket). Subscribe to the tenant&apos;s private channel:</P>
            <Pre>{`// Channel name
private-tenant.{TENANT_ID}.locations

// Event fired on position batch
App\\Events\\LocationsBatchEvent

// Payload
{
  "positions": [
    {
      "device_id":   42,
      "lat":         31.5204,
      "lon":         74.3587,
      "battery":     87,
      "recorded_at": "2026-06-04T08:12:33Z"
    }
  ]
}`}</Pre>
            <P>Channel auth is handled by the <Code>POST /broadcasting/auth</Code> endpoint using the machine API key — no user session required.</P>

            <H2>Rate Limits</H2>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li>REST API: 200 requests per minute per API key</Li>
                <Li>WebSocket events: 200 client events per second per channel</Li>
            </ul>
            <P>Responses include standard rate-limit headers (<Code>X-RateLimit-Limit</Code>, <Code>X-RateLimit-Remaining</Code>).</P>

            <H2>Example — List Devices</H2>
            <Pre>{`curl -X GET \\
  https://api.your-domain.com/api/portal/devices \\
  -H "Authorization: Bearer tpk_xxxxxxxxxxxxxxxx" \\
  -H "X-Tenant-Id: 42" \\
  -H "Accept: application/json"`}</Pre>

            <H2>Example — Resolve an Incident</H2>
            <Pre>{`curl -X PATCH \\
  https://api.your-domain.com/api/portal/incidents/17 \\
  -H "Authorization: Bearer tpk_xxxxxxxxxxxxxxxx" \\
  -H "X-Tenant-Id: 42" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"resolved","resolution_notes":"Operator confirmed safe return"}'`}</Pre>

            <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                <strong className="text-foreground">API keys</strong> are generated in the admin panel under <strong>Organisations → {'{your org}'} → Portal API Keys</strong>. Each key is shown once and stored hashed — treat it like a password.
            </div>
        </main>
    );
}
