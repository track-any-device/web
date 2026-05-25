import type { Metadata } from 'next';
import { Callout, CodeBlock } from '@/components/docs/tad101-layout';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Raspberry Pi Guide – TAD101 | Track Any Device' };

const PIP = `pip install pysher python-socketio requests`;

const PYTHON = `\
import pysher

pusher = pysher.Pusher(
    key="YOUR_APP_KEY",
    custom_host="soketi.example.com",
    port=6001,
    secure=False,
)

def connect_handler(data):
    channel = pusher.subscribe(f"private-device.{imei}")
    channel.bind("tad101.ping", on_ping)

pusher.connection.bind("pusher:connection_established", connect_handler)
pusher.connect()

import time

while True:
    time.sleep(30)  # send telemetry
`;

const SYSTEMD = `\
[Unit]
Description=TAD101 Raspberry Pi agent
After=network-online.target

[Service]
ExecStart=/usr/bin/python3 /opt/tad101/agent.py
Restart=always
User=pi

[Install]
WantedBy=multi-user.target`;

export default function RaspberryPiPage() {
    return (
        <>
<h2>Device type</h2>
            <table>
                <tbody>
                    <tr>
                        <td>Slug</td>
                        <td>
                            <code>raspberry_pi</code>
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
                        <td>Pi Zero W · Pi 3B+ · Pi 4B · Pi 5</td>
                    </tr>
                </tbody>
            </table>

            <h2>Install dependencies</h2>
            <CodeBlock language="bash">{PIP}</CodeBlock>

            <h2>
                Python client (<code>tad101_client.py</code>)
            </h2>
            <CodeBlock language="python">{PYTHON}</CodeBlock>

            <h2>Run as a service</h2>
            <CodeBlock language="ini">{SYSTEMD}</CodeBlock>
            <p>
                Enable with{' '}
                <code>
                    sudo systemctl enable tad101 &amp;&amp; sudo systemctl start
                    tad101
                </code>
                . Tail logs with <code>sudo journalctl -u tad101 -f</code>.
            </p>
        </>
    );
}
