import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Architecture – TAD101 | Track Any Device' };

const TOPOLOGY = `\
Device (Android/iOS/Arduino/RPi)
  └─ WebSocket ──► Soketi (Pusher-compatible)
                     └─ private-tad101.device.{imei}
                          ├─ client-tad101-* events ──► TAD101 driver
                          └─ tad101-command ◄────────── Command bus`;

const AUTH_FLOW = `\
1. Device POST /api/tad101/auth  { imei, secret }
2. Server validates secret  →  issues Soketi channel auth token
3. Device subscribes to private-tad101.device.{imei}
4. Telemetry pushed as client-tad101-signal events`;

export default function ArchitecturePage() {
    return (
        <>
<h2>System topology</h2>
            <CodeBlock>{TOPOLOGY}</CodeBlock>

            <h2>Channel taxonomy</h2>
            <table>
                <thead>
                    <tr>
                        <th>Channel</th>
                        <th>Purpose</th>
                        <th>Auth</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <code>private-tad101.device.{`{imei}`}</code>
                        </td>
                        <td>
                            Per-device telemetry + command bus. The server
                            broadcasts the <code>tad101-command</code> event on
                            this channel to reach the device.
                        </td>
                        <td>Private, device secret</td>
                    </tr>
                    <tr>
                        <td>
                            <code>tenant.{`{tenant_id}`}.devices</code>
                        </td>
                        <td>Tenant portal feed</td>
                        <td>Private, tenant</td>
                    </tr>
                    <tr>
                        <td>
                            <code>user.{`{user_id}`}.devices</code>
                        </td>
                        <td>End-user app feed</td>
                        <td>Private, user</td>
                    </tr>
                </tbody>
            </table>

            <h2>Authentication flow</h2>
            <CodeBlock>{AUTH_FLOW}</CodeBlock>

            <h2>Soketi configuration</h2>
            <p>
                TAD101 reuses the same Soketi instance that powers Laravel
                broadcasting. Set <code>PUSHER_*</code> values for both Laravel
                and the Docker Compose <code>soketi</code> service — Laravel
                ships a config that maps to those env vars automatically.
            </p>

            <CodeBlock language=".env">{`# Soketi / Pusher-compatible broadcaster
PUSHER_APP_ID=tad101
PUSHER_APP_KEY=tad101_key
PUSHER_APP_SECRET=change-in-production
PUSHER_HOST=soketi
PUSHER_PORT=6001
PUSHER_SCHEME=http
PUSHER_APP_CLUSTER=mt1

# TAD101 wiring
TAD101_SERVER_HOST=fleet.yourdomain.com
TAD101_WS_URL=wss://fleet.yourdomain.com
TAD101_WEBHOOK_SECRET=<hex32>`}</CodeBlock>

            <h2>REST fallback</h2>
            <p>
                Devices that cannot keep a long-lived WebSocket open may POST
                the same envelope to <code>/api/tad101/inbound</code> with the
                device secret as a bearer token. The envelope shape is identical
                — see <a href="/docs/tad101/envelope">Message Envelope</a>.
            </p>
        </>
    );
}
