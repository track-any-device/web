import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'iOS Integration – TAD101 | Track Any Device' };

const SPM = `\
// Package.swift
.package(url: "https://github.com/pusher/pusher-websocket-swift", from: "10.0.0")`;

const SWIFT = `\
import PusherSwift

let options = PusherClientOptions(host: .custom("soketi.example.com"), port: 6001, useTLS: false)
let pusher = Pusher(key: "YOUR_APP_KEY", options: options)
pusher.connect()

let channel = pusher.subscribeToPrivateChannel("private-device.\\(imei)")
channel.bind(eventName: "tad101.ping") { event in
    // respond with telemetry
}`;

export default function IosPage() {
    return (
        <>
<h2>Device type</h2>
            <table>
                <tbody>
                    <tr>
                        <td>Slug</td>
                        <td>
                            <code>ios_app</code>
                        </td>
                    </tr>
                    <tr>
                        <td>Driver</td>
                        <td>
                            <code>Tad101Driver</code>
                        </td>
                    </tr>
                    <tr>
                        <td>Transport</td>
                        <td>pusher-websocket-swift over Soketi</td>
                    </tr>
                </tbody>
            </table>

            <h2>Swift Package Manager</h2>
            <CodeBlock language="swift">{SPM}</CodeBlock>

            <h2>Implementation</h2>
            <CodeBlock language="swift">{SWIFT}</CodeBlock>

            <h2>Sensors available on iOS</h2>
            <table>
                <thead>
                    <tr>
                        <th>Sensor</th>
                        <th>iOS API</th>
                        <th>TAD101 field</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>GPS location</td>
                        <td>
                            <code>CLLocationManager</code>
                        </td>
                        <td>lat, lng, alt, speed, direction</td>
                    </tr>
                    <tr>
                        <td>Battery %</td>
                        <td>
                            <code>UIDevice.batteryLevel</code>
                        </td>
                        <td>battery_pct</td>
                    </tr>
                    <tr>
                        <td>GSM signal</td>
                        <td>
                            <code>CTTelephonyNetworkInfo</code>
                        </td>
                        <td>gsm_signal</td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}
