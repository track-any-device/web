import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const metadata: Metadata = { title: 'Present Your Idea – TAD101 | Track Any Device' };

export default function PresentYourIdeaPage() {
    return (
        <>
<p className="lead">
                TAD101 is an open, self-hosted protocol designed to be extended.
                If you have a device, sensor, or use case that isn't covered
                yet, we want to hear from you — and help you ship it.
            </p>

            <h2>What you can build</h2>

            <h3>Hardware devices</h3>
            <ul>
                <li>Custom GPS tracker (ESP32 + Neo-8M)</li>
                <li>Smart helmet with SOS button</li>
                <li>School bag tracker for children</li>
                <li>Livestock / pet collar tracker</li>
                <li>Vehicle OBD-II adapter feeding TAD101</li>
                <li>
                    Environmental sensor node (temperature, humidity, air
                    quality)
                </li>
                <li>Industrial asset tracker</li>
                <li>Personal safety wearable</li>
            </ul>

            <h3>Software integrations</h3>
            <ul>
                <li>Flutter / React Native tracking app</li>
                <li>Web dashboard widget (embed the TAD101 map anywhere)</li>
                <li>Home Assistant integration</li>
                <li>MQTT ↔ TAD101 bridge</li>
                <li>Custom alert rules &amp; automations</li>
                <li>Delivery / fleet management overlay</li>
                <li>Geofencing notification service</li>
            </ul>

            <h2>How to submit your idea</h2>

            <h3>Option A — New device type</h3>
            <ol>
                <li>Fill in the proposal template below.</li>
                <li>
                    Open a GitHub issue with label{' '}
                    <code>tad101-device-proposal</code>.
                </li>
                <li>
                    We'll create your <code>DeviceType</code> and a
                    documentation page like this one.
                </li>
            </ol>

            <h3>Option B — New sensor</h3>
            <ol>
                <li>
                    Describe the sensor: name, unit, data type, how it's
                    produced.
                </li>
                <li>
                    We'll add it to the Sensor Registry and update the TAD101
                    payload spec.
                </li>
            </ol>

            <h3>Option C — New protocol bridge</h3>
            <p>
                If you have a device on a different protocol (GT06, MQTT, CoAP)
                and want it to feed into TAD101, propose a bridge driver
                implementing <code>DeviceDriverInterface</code>.
            </p>

            <Callout tone="info">
                <h4 className="m-0 mb-2 text-sm font-semibold">
                    Device type proposal template
                </h4>
                <pre className="m-0 font-mono text-xs whitespace-pre-wrap">{`Name:           [Your device name]
Slug:           [lowercase_underscore]
Category:       [wearable | vehicle | industrial | personal | other]
Connection:     [WiFi | BLE+Gateway | LTE | LoRa | Other]
Sensors:        [list every sensor it produces]
Special Events: [any events beyond standard update/sos/heartbeat]
GSM Commands:   [if any SMS commands, list format]
Open Source:    [yes/no — will you share the firmware/code?]
Hardware Cost:  [approximate BOM cost USD]
Description:    [what problem does this solve? who uses it?]`}</pre>
            </Callout>

            <h2>Distribution model</h2>
            <p>Once your device type is accepted:</p>
            <ul>
                <li>It gets a permanent documentation page in this system.</li>
                <li>It appears in the Filament device type catalogue.</li>
                <li>Customers can select it when adding a device.</li>
                <li>You can distribute pre-configured hardware.</li>
                <li>Your onboarding guide is built into the platform UI.</li>
            </ul>
        </>
    );
}
