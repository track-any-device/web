import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'Message Envelope – TAD101 | Track Any Device' };

const ENVELOPE = `\
{
  "tad": "1.0",
  "imei": "860000000000001",
  "ts": 1715000000,
  "payload": { ... }
}`;

const PAYLOAD = `\
{
  "lat": 31.5497,
  "lng": 74.3436,
  "alt": 215,
  "speed": 0,
  "direction": 0,
  "battery_pct": 87,
  "gsm_signal": -73
}`;

const COMMAND = `\
{
  "cmd": "ping",
  "id": "cmd-abc123"
}`;

export default function EnvelopePage() {
    return (
        <>
<h2>Inbound event (Device → Server)</h2>
            <p>
                Every event sent by any TAD101 device MUST conform to this JSON
                envelope.
            </p>
            <CodeBlock language="json">{ENVELOPE}</CodeBlock>

            <h3>Envelope fields</h3>
            <table>
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <code>tad</code>
                        </td>
                        <td>string</td>
                        <td>✓</td>
                        <td>
                            Always <code>"101"</code>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <code>v</code>
                        </td>
                        <td>string</td>
                        <td>✓</td>
                        <td>
                            Protocol version, e.g. <code>"1.0"</code>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <code>imei</code>
                        </td>
                        <td>string</td>
                        <td>✓</td>
                        <td>Device hardware ID</td>
                    </tr>
                    <tr>
                        <td>
                            <code>event</code>
                        </td>
                        <td>string</td>
                        <td>✓</td>
                        <td>Event type (see below)</td>
                    </tr>
                    <tr>
                        <td>
                            <code>ts</code>
                        </td>
                        <td>integer</td>
                        <td>✓</td>
                        <td>Unix timestamp (UTC, device clock)</td>
                    </tr>
                    <tr>
                        <td>
                            <code>seq</code>
                        </td>
                        <td>integer</td>
                        <td>✓</td>
                        <td>Sequence number (for dedup)</td>
                    </tr>
                    <tr>
                        <td>
                            <code>payload</code>
                        </td>
                        <td>object</td>
                        <td>✓</td>
                        <td>Sensor data (see below)</td>
                    </tr>
                </tbody>
            </table>

            <h2>Event types</h2>
            <table>
                <thead>
                    <tr>
                        <th>
                            <code>event</code>
                        </th>
                        <th>Meaning</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <code>update</code>
                        </td>
                        <td>Regular telemetry / location update</td>
                    </tr>
                    <tr>
                        <td>
                            <code>heartbeat</code>
                        </td>
                        <td>Keepalive with battery / mode info</td>
                    </tr>
                    <tr>
                        <td>
                            <code>punch_in</code>
                        </td>
                        <td>Worker clock-in</td>
                    </tr>
                    <tr>
                        <td>
                            <code>punch_out</code>
                        </td>
                        <td>Worker clock-out</td>
                    </tr>
                    <tr>
                        <td>
                            <code>sos</code>
                        </td>
                        <td>Emergency alert</td>
                    </tr>
                    <tr>
                        <td>
                            <code>intercom</code>
                        </td>
                        <td>PTT voice / audio event</td>
                    </tr>
                    <tr>
                        <td>
                            <code>registration</code>
                        </td>
                        <td>First connect / re-registration</td>
                    </tr>
                    <tr>
                        <td>
                            <code>alarm</code>
                        </td>
                        <td>Generic alarm (subtype in payload)</td>
                    </tr>
                    <tr>
                        <td>
                            <code>command_ack</code>
                        </td>
                        <td>Response to a server-sent command</td>
                    </tr>
                    <tr>
                        <td>
                            <code>config_report</code>
                        </td>
                        <td>Device reports its current config</td>
                    </tr>
                    <tr>
                        <td>
                            <code>custom</code>
                        </td>
                        <td>
                            Device-defined event (with{' '}
                            <code>payload.custom_type</code>)
                        </td>
                    </tr>
                </tbody>
            </table>

            <h2>Payload fields</h2>
            <p>
                All fields are <strong>optional</strong>. Devices send only what
                they have; the server maps non-null fields onto the signals
                schema.
            </p>
            <CodeBlock language="json">{PAYLOAD}</CodeBlock>

            <h2>Outbound command (Server → Device)</h2>
            <CodeBlock language="json">{COMMAND}</CodeBlock>
            <p>
                The device MUST respond with a <code>command_ack</code> event
                referencing <code>cmd_id</code>.
            </p>

            <h2>Pusher event naming</h2>
            <table>
                <thead>
                    <tr>
                        <th>Direction</th>
                        <th>Pusher event</th>
                        <th>TAD101 event</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Device → Server</td>
                        <td>
                            <code>client-tad101-signal</code>
                        </td>
                        <td>update, punch_in, punch_out, …</td>
                    </tr>
                    <tr>
                        <td>Device → Server</td>
                        <td>
                            <code>client-tad101-heartbeat</code>
                        </td>
                        <td>heartbeat</td>
                    </tr>
                    <tr>
                        <td>Device → Server</td>
                        <td>
                            <code>client-tad101-sos</code>
                        </td>
                        <td>sos</td>
                    </tr>
                    <tr>
                        <td>Device → Server</td>
                        <td>
                            <code>client-tad101-ack</code>
                        </td>
                        <td>command_ack</td>
                    </tr>
                    <tr>
                        <td>Server → Device</td>
                        <td>
                            <code>tad101-command</code>
                        </td>
                        <td>Any server command</td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}
