import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Portal API | Track Any Device' };

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
        GET:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        POST:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        PUT:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        PATCH:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

export default function MyApiDocs() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <Link href="/docs/api/my" className="hover:text-primary">API Reference</Link>
                {' / '}
                <span>My Portal API</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 3 — API Reference</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">My Portal API</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    REST endpoints for the end-user portal — manage your own devices, beats, incidents, and notification preferences.
                </p>
            </header>

            <H2>Overview</H2>
            <P>
                The My Portal API is a JSON REST API served at <Code>/api/my/</Code>. It is consumed by
                the <Code>web/</Code> Next.js portal and can be called directly from mobile apps or custom
                integrations. All data is scoped to the authenticated user — you can only access your own
                registered devices, beats, and incidents.
            </P>

            <H2>Authentication</H2>
            <P>Every request requires an OAuth2 Bearer token issued by the SSO server after login:</P>
            <Pre>{`Authorization: Bearer {access_token}`}</Pre>
            <P>
                Tokens are obtained via the OAuth2 authorization code flow (client: <Code>OAuthClientKind::My</Code>).
                The <Code>web/</Code> portal acquires and refreshes tokens automatically through NextAuth.
                Expired or invalid tokens return <Code>401 Unauthorized</Code>.
            </P>

            <H2>Base URL</H2>
            <Pre>{`https://api.your-domain.com/api/my/`}</Pre>

            <H2>Devices</H2>
            <P>
                Devices are GPS trackers registered to your account. Each device has a name, optional photo,
                optional notes, a beat assignment, and real-time location data from the tracker hardware.
            </P>

            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET"  path="/devices"                               description="List all devices on your account. Returns image_url, notes, last signal, battery, and beat assignment." />
                <Endpoint method="GET"  path="/devices/{id}"                          description="Get a single device with full detail." />
                <Endpoint method="PUT"  path="/devices/{id}"                          description="Update device name, notes (max 1000 chars), beat_id, or map_icon." />
                <Endpoint method="POST" path="/devices/register"                      description="Register a device to your account by entering its last 10 IMEI digits." />
                <Endpoint method="POST" path="/devices/{id}/image"                    description="Upload a photo for the device (JPEG / PNG / WebP, max 4 MB). Returns image_url." />
                <Endpoint method="GET"  path="/devices/{id}/notification-preferences" description="List all alert event types with your current SMS notification setting for this device." />
                <Endpoint method="PUT"  path="/devices/{id}/notification-preferences" description="Enable or snooze SMS alerts per event type. Disabling snoozes for 24 hours." />
            </div>

            <H3>Device object</H3>
            <Pre>{`{
  "id":           42,
  "name":         "My Tracker",
  "imei":         "123456789012345",
  "status":       "active",
  "map_icon":     "car",
  "image_url":    "https://api.your-domain.com/storage/devices/images/abc.jpg",
  "notes":        "Installed under the dashboard",
  "battery_percent": 87,
  "last_lat":     31.5204,
  "last_lon":     74.3587,
  "last_seen_at": "2026-06-11T09:45:00Z",
  "beat": { "id": 5, "name": "City Zone A" }
}`}</Pre>

            <H3>Register a device</H3>
            <P>
                Devices are shipped with an IMEI printed on the label. Enter the <strong>last 10 digits</strong> to
                claim the device. The P901 ID card broadcasts an 11-digit number with a leading zero — both
                formats are accepted automatically.
            </P>
            <Pre>{`POST /api/my/devices/register
Content-Type: application/json

{ "device_id": "8901234567" }

// 200 OK — device registered
{
  "message": "Device registered successfully.",
  "device": { ...device object... }
}

// 404 — no device found with that IMEI suffix
// 409 — device is already registered to an account`}</Pre>

            <H3>Upload a device photo</H3>
            <Pre>{`POST /api/my/devices/{id}/image
Content-Type: multipart/form-data

image=<file>   // field name must be "image"; JPEG/PNG/WebP, max 4 MB

// 200 OK
{ "image_url": "https://api.your-domain.com/storage/devices/images/abc.jpg" }`}</Pre>

            <H3>Update device</H3>
            <Pre>{`PUT /api/my/devices/{id}
Content-Type: application/json

{
  "name":     "Warehouse Unit 3",
  "notes":    "Assigned to night shift",
  "beat_id":  7,
  "map_icon": "truck"
}`}</Pre>

            <H2>Notification Preferences</H2>
            <P>
                Control which event types send you an SMS alert for each device. Preferences are
                per-device and per-event-type. Disabling an alert snoozes it for 24 hours — it
                re-enables automatically when the snooze expires.
            </P>

            <H3>Event types</H3>
            <div className="my-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="px-3 py-2 text-left font-semibold">event_type</th>
                            <th className="px-3 py-2 text-left font-semibold">Label</th>
                            <th className="px-3 py-2 text-left font-semibold">Trigger</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">sos</td><td className="px-3 py-1.5">SOS Distress</td><td className="px-3 py-1.5">Device SOS button pressed</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">overspeed</td><td className="px-3 py-1.5">Overspeed</td><td className="px-3 py-1.5">Speed exceeds threshold</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">low_battery</td><td className="px-3 py-1.5">Low Battery</td><td className="px-3 py-1.5">Battery below threshold</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">power_failure</td><td className="px-3 py-1.5">Power Failure</td><td className="px-3 py-1.5">External power cut</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">vibration</td><td className="px-3 py-1.5">Vibration / Shock</td><td className="px-3 py-1.5">Motion / tamper detected</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">beat_violation</td><td className="px-3 py-1.5">Beat Violation</td><td className="px-3 py-1.5">Device left assigned zone</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">device_offline</td><td className="px-3 py-1.5">Device Offline</td><td className="px-3 py-1.5">No signal for configured period</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">device_online</td><td className="px-3 py-1.5">Device Online</td><td className="px-3 py-1.5">Device reconnects after offline</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">gps_lost</td><td className="px-3 py-1.5">GPS Lost</td><td className="px-3 py-1.5">GPS fix lost indoors or jammed</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">punch_in</td><td className="px-3 py-1.5">Punch In</td><td className="px-3 py-1.5">Assignee clocked in</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">punch_out</td><td className="px-3 py-1.5">Punch Out</td><td className="px-3 py-1.5">Assignee clocked out</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">idle_too_long</td><td className="px-3 py-1.5">Idle Too Long</td><td className="px-3 py-1.5">No movement for configured period</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">punch_in_outside_beat</td><td className="px-3 py-1.5">Punch In Outside Beat</td><td className="px-3 py-1.5">Clocked in outside assigned zone</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">punch_out_outside_beat</td><td className="px-3 py-1.5">Punch Out Outside Beat</td><td className="px-3 py-1.5">Clocked out outside assigned zone</td></tr>
                        <tr><td className="px-3 py-1.5 font-mono">missed_punch_in</td><td className="px-3 py-1.5">Missed Punch In</td><td className="px-3 py-1.5">Expected punch-in not received</td></tr>
                    </tbody>
                </table>
            </div>

            <H3>Get preferences</H3>
            <Pre>{`GET /api/my/devices/{id}/notification-preferences

// 200 OK
{
  "data": [
    {
      "event_type":        "sos",
      "label":             "SOS Distress",
      "sms_enabled":       true,
      "sms_disabled_until": null
    },
    {
      "event_type":        "device_offline",
      "label":             "Device Offline",
      "sms_enabled":       false,
      "sms_disabled_until": "2026-06-12T08:30:00+00:00"
    }
    // ... all 15 event types
  ]
}`}</Pre>
            <P>All 15 event types are always returned. Defaults to <Code>sms_enabled: true</Code> for any type
            not yet configured. A snooze that has expired is automatically cleared and returned as enabled.</P>

            <H3>Update preferences</H3>
            <Pre>{`PUT /api/my/devices/{id}/notification-preferences
Content-Type: application/json

{
  "preferences": [
    { "event_type": "sos",            "sms_enabled": true  },
    { "event_type": "device_offline", "sms_enabled": false }
  ]
}

// 200 OK
{ "message": "Notification preferences updated." }`}</Pre>
            <P>You may send a partial list — only the event types you include are updated.
            Setting <Code>sms_enabled: false</Code> automatically sets <Code>sms_disabled_until</Code> to
            24 hours from now. Setting it back to <Code>true</Code> clears the snooze immediately.</P>

            <H2>Incidents</H2>
            <P>Incidents are alerts generated automatically when a device triggers an alert rule.
            The My portal shows incidents for your registered devices only.</P>

            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/incidents" description="List incidents. Paginated (50 per page). Supports device_id, beat_id, and days filters." />
                <Endpoint method="GET" path="/incidents/{id}" description="Get a single incident with device and beat details." />
            </div>

            <H3>Filtering incidents</H3>
            <Pre>{`GET /api/my/incidents?device_id=42&days=7
GET /api/my/incidents?beat_id=5&days=30
GET /api/my/incidents?days=3          // default — last 3 days
GET /api/my/incidents?days=0          // all time`}</Pre>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><Code>device_id</Code> — filter to incidents for a specific device</Li>
                <Li><Code>beat_id</Code> — filter to incidents triggered within a specific beat</Li>
                <Li><Code>days</Code> — number of days to look back (default: <Code>3</Code>, set to <Code>0</Code> for all time)</Li>
                <Li><Code>per_page</Code> — results per page (default: <Code>50</Code>, max: <Code>100</Code>)</Li>
            </ul>

            <H3>Incident object</H3>
            <Pre>{`{
  "id":           301,
  "event_type":   "beat_violation",
  "status":       "open",
  "priority":     "high",
  "triggered_at": "2026-06-11T08:12:33Z",
  "resolved_at":  null,
  "device": { "id": 42, "name": "My Tracker" },
  "beat":   { "id": 5,  "name": "City Zone A" }
}`}</Pre>

            <H2>Beats</H2>
            <P>
                Beats are geographic zones you draw on the map. Devices assigned to a beat trigger
                an alert when they leave the zone.
            </P>

            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET"    path="/beats"     description="List all beats you have created." />
                <Endpoint method="POST"   path="/beats"     description="Create a new beat with a polygon boundary (GeoJSON or lat/lon array)." />
                <Endpoint method="GET"    path="/beats/{id}" description="Get a single beat with its polygon and assigned devices." />
                <Endpoint method="PUT"    path="/beats/{id}" description="Update beat name, colour, or boundary polygon." />
                <Endpoint method="DELETE" path="/beats/{id}" description="Delete a beat. Devices assigned to it are unlinked." />
            </div>

            <H2>Real-time Device Updates</H2>
            <P>
                Device positions update in real time via Soketi (Pusher-compatible WebSocket).
                Authenticate a private channel, then listen for location events:
            </P>
            <Pre>{`// Authenticate the channel
POST /api/my/pusher/auth
Content-Type: application/x-www-form-urlencoded

socket_id=...&channel_name=private-my.user.{USER_ID}.devices

// Subscribe and listen
// Channel: private-my.user.{USER_ID}.devices
// Event:   App\\Events\\DeviceLocationUpdated
// Payload:
{
  "device_id":   42,
  "lat":         31.5204,
  "lon":         74.3587,
  "heading":     270,
  "speed":       45.2,
  "battery":     87,
  "recorded_at": "2026-06-11T09:45:22Z"
}`}</Pre>

            <H2>Response Format</H2>
            <P>All endpoints return JSON. Lists use Laravel pagination:</P>
            <Pre>{`{
  "data":         [...],
  "total":        84,
  "current_page": 1,
  "last_page":    2,
  "per_page":     50
}`}</Pre>
            <P>Single resources return the object directly.
            Errors use Laravel&apos;s standard format with <Code>message</Code> and optional <Code>errors</Code> keys.
            Validation errors return <Code>422 Unprocessable Entity</Code>.</P>

            <H2>Error codes</H2>
            <div className="my-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="px-3 py-2 text-left font-semibold">HTTP</th>
                            <th className="px-3 py-2 text-left font-semibold">Meaning</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">401</td><td className="px-3 py-1.5">Missing or invalid Bearer token</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">403</td><td className="px-3 py-1.5">Authenticated but not authorised (e.g. another user&apos;s device)</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">404</td><td className="px-3 py-1.5">Resource not found or no device matched the IMEI suffix</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">409</td><td className="px-3 py-1.5">Device already registered to an account</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-1.5 font-mono">422</td><td className="px-3 py-1.5">Validation error — check <Code>errors</Code> key</td></tr>
                        <tr><td className="px-3 py-1.5 font-mono">429</td><td className="px-3 py-1.5">Rate limit exceeded</td></tr>
                    </tbody>
                </table>
            </div>
        </main>
    );
}
