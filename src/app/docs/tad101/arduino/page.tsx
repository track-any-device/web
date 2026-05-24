import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'Arduino Guide – TAD101 | Track Any Device' };

const PLATFORMIO = `\
[env:arduino_uno_wifi]
platform = atmelavr
board = uno
framework = arduino
lib_deps =
    links2004/WebSockets@^2.4.1`;

const WIRING = `\
Arduino Uno WiFi Rev2
  D2  ──► GPS TX (SoftwareSerial)
  D3  ──► GPS RX (SoftwareSerial)
  D13 ──► Status LED (active-high)`;

const SKETCH = `\
#include <WebSocketsClient.h>

WebSocketsClient wsClient;

void setup() {
  Serial.begin(9600);
  wsClient.begin("soketi.example.com", 6001, "/app/YOUR_APP_KEY");
  wsClient.onEvent(webSocketEvent);
}

void loop() {
  wsClient.loop();
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_TEXT) {
    // parse and respond to TAD101 command
  }
}`;

export default function ArduinoPage() {
    return (
        <>
<h2>Device type</h2>
            <table>
                <tbody>
                    <tr>
                        <td>Slug</td>
                        <td>
                            <code>arduino</code>
                        </td>
                    </tr>
                    <tr>
                        <td>Driver</td>
                        <td>
                            <code>Tad101Driver</code>
                        </td>
                    </tr>
                    <tr>
                        <td>Recommended boards</td>
                        <td>ESP32 DevKit · MKR WiFi 1010 · Arduino Uno WiFi</td>
                    </tr>
                </tbody>
            </table>

            <h2>PlatformIO setup</h2>
            <CodeBlock language="ini">{PLATFORMIO}</CodeBlock>

            <h2>Wiring (ESP32 + Neo-6M GPS)</h2>
            <CodeBlock>{WIRING}</CodeBlock>

            <h2>Sketch</h2>
            <CodeBlock language="cpp">{SKETCH}</CodeBlock>
        </>
    );
}
