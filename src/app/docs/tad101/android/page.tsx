import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'Android Integration – TAD101 | Track Any Device' };

const GRADLE = `\
dependencies {
    implementation 'com.pusher:pusher-java-client:2.4.4'
    implementation 'com.google.android.gms:play-services-location:21.0.1'
}`;

const KOTLIN = `\
import com.pusher.client.Pusher
import com.pusher.client.PusherOptions

val options = PusherOptions().apply {
    setHost("soketi.example.com")
    setWsPort(6001)
    isUseTLS = false
}
val pusher = Pusher("YOUR_APP_KEY", options)
pusher.connect()

val channel = pusher.subscribePrivate("private-device.YOUR_DEVICE_ID")
channel.bind("tad101.ping") { _, _, data ->
    // respond with telemetry
}`;

export default function AndroidPage() {
    return (
        <>
<h2>Device type</h2>
            <table>
                <tbody>
                    <tr>
                        <td>Slug</td>
                        <td>
                            <code>android_app</code>
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
                        <td>Pusher Android SDK over Soketi</td>
                    </tr>
                </tbody>
            </table>

            <h2>SDK install</h2>
            <CodeBlock language="gradle">{GRADLE}</CodeBlock>

            <h2>Kotlin implementation</h2>
            <CodeBlock language="kotlin">{KOTLIN}</CodeBlock>

            <h2>Sensors available on Android</h2>
            <table>
                <thead>
                    <tr>
                        <th>Sensor</th>
                        <th>Android API</th>
                        <th>TAD101 field</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>GPS location</td>
                        <td>
                            <code>LocationManager</code> / Fused
                        </td>
                        <td>lat, lng, alt, speed, direction</td>
                    </tr>
                    <tr>
                        <td>GPS accuracy</td>
                        <td>
                            <code>Location.accuracy</code>
                        </td>
                        <td>hdop (approximated)</td>
                    </tr>
                    <tr>
                        <td>Battery %</td>
                        <td>
                            <code>BatteryManager</code>
                        </td>
                        <td>battery_pct</td>
                    </tr>
                    <tr>
                        <td>Battery voltage</td>
                        <td>
                            <code>BATTERY_PROPERTY_VOLTAGE</code>
                        </td>
                        <td>battery_mv</td>
                    </tr>
                    <tr>
                        <td>GSM signal</td>
                        <td>
                            <code>TelephonyManager</code>
                        </td>
                        <td>gsm_signal</td>
                    </tr>
                    <tr>
                        <td>Cell info</td>
                        <td>
                            <code>getAllCellInfo()</code>
                        </td>
                        <td>mcc, mnc, lac, cell_id</td>
                    </tr>
                    <tr>
                        <td>Temperature</td>
                        <td>
                            <code>TYPE_AMBIENT_TEMPERATURE</code>
                        </td>
                        <td>temperature</td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}
