import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Overview – TAD101 | Track Any Device' };

export default function OverviewPage() {
    return (
        <>
<p className="lead">
                <strong>TAD101</strong> (Track Any Device, version 101) is a
                universal, self-hosted, real-time device telemetry protocol. Any
                device that can open a TLS WebSocket can join the platform —
                from a $3 ESP8266 to a production Android app to a Raspberry Pi
                cluster.
            </p>

            <h2>Identity</h2>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <strong>Protocol Name</strong>
                        </td>
                        <td>TAD101</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Current Version</strong>
                        </td>
                        <td>"1.0.0"</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Transport</strong>
                        </td>
                        <td>WebSocket (Soketi / Pusher-compatible)</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Encoding</strong>
                        </td>
                        <td>JSON</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Direction</strong>
                        </td>
                        <td>Bidirectional (Device ↔ Server)</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Driver Class</strong>
                        </td>
                        <td>
                            <code>App\Drivers\Tad101Driver</code>
                        </td>
                    </tr>
                </tbody>
            </table>

            <h2>Philosophy</h2>
            <ol>
                <li>
                    <strong>Every device is welcome.</strong> No proprietary
                    firmware required — if it speaks WebSocket, it speaks
                    TAD101.
                </li>
                <li>
                    <strong>Every command exists.</strong> TAD101 is a strict
                    superset of every other driver. Every SMS command, AT
                    command, or action available in JT808, GT06, H02 or GPS103
                    has a TAD101 equivalent; hardware-incapable commands no-op
                    gracefully.
                </li>
                <li>
                    <strong>Signals are uniform.</strong> Every event produces
                    an identical <code>SignalObject</code> regardless of origin
                    device. Consumers never need to know whether the data came
                    from a $5 GPS tracker or an iPhone.
                </li>
                <li>
                    <strong>Open ecosystem.</strong> The protocol is documented,
                    extensible, and welcomes new device types. See{' '}
                    <em>Present Your Idea</em>.
                </li>
            </ol>

            <Callout tone="info">
                <strong>New here?</strong> Start with the{' '}
                <a href="/docs/tad101/architecture">Architecture</a> page to see
                how Soketi, Laravel, and your device fit together — then jump to
                the integration guide for your platform.
            </Callout>

            <h2>Supported device types (out of the box)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Device Type</th>
                        <th>Slug</th>
                        <th>SDK / Library</th>
                        <th>Guide</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Android App</td>
                        <td>
                            <code>android_app</code>
                        </td>
                        <td>pusher-java-client</td>
                        <td>
                            <a href="/docs/tad101/android">Android</a>
                        </td>
                    </tr>
                    <tr>
                        <td>iOS App</td>
                        <td>
                            <code>ios_app</code>
                        </td>
                        <td>pusher-websocket-swift</td>
                        <td>
                            <a href="/docs/tad101/ios">iOS</a>
                        </td>
                    </tr>
                    <tr>
                        <td>Arduino / ESP32</td>
                        <td>
                            <code>arduino</code>
                        </td>
                        <td>ArduinoWebsockets</td>
                        <td>
                            <a href="/docs/tad101/arduino">Arduino</a>
                        </td>
                    </tr>
                    <tr>
                        <td>Raspberry Pi</td>
                        <td>
                            <code>raspberry_pi</code>
                        </td>
                        <td>pusher (Python)</td>
                        <td>
                            <a href="/docs/tad101/raspberry-pi">Raspberry Pi</a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}
