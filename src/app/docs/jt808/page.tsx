import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'JT808 Protocol | Track Any Device' };

function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight border-b border-border pb-2">{children}</h2>;
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
function Note({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            {children}
        </div>
    );
}

export default function Jt808Page() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <span>JT808 Protocol</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 2 — Device Protocols</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">JT808 GPS Protocol</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    Connect industry-standard JT/T 808-2019 GPS trackers to the platform via TCP.
                </p>
            </header>

            <H2>What is JT808?</H2>
            <P>JT/T 808-2019 is a Chinese national standard for vehicle-mounted GPS terminal communication, widely used across fleet and logistics hardware. It defines a binary protocol over persistent TCP connections for location reporting, alarms, and bidirectional commands.</P>
            <P>Track Any Device implements a high-performance JT808 server that accepts these connections natively, so compatible hardware connects without any firmware modification.</P>

            <H2>Connection</H2>
            <P>Configure your GPS tracker to connect to the platform&apos;s TCP endpoint:</P>
            <div className="my-4 rounded-lg border border-border bg-muted/60 p-4 font-mono text-sm">
                <p><span className="text-muted-foreground">Host:</span> <strong>your-domain.com</strong></p>
                <p><span className="text-muted-foreground">Port:</span> <strong>7018</strong></p>
                <p><span className="text-muted-foreground">Protocol:</span> <strong>TCP (raw, not HTTP)</strong></p>
            </div>
            <Note>
                The TCP port (7018) cannot be routed through Cloudflare Tunnel. It requires direct TCP exposure — either via your server&apos;s firewall, an frp reverse proxy, or Cloudflare Spectrum. Contact your platform engineer for the correct endpoint.
            </Note>

            <H2>Supported Hardware</H2>
            <P>Any GPS tracker that implements JT/T 808-2019 (or the earlier JT/T 808-2011 revision) can connect. This includes:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li>Vehicle-mounted GPS trackers from major Chinese manufacturers</Li>
                <Li>Smart card trackers used for personnel and asset tracking</Li>
                <Li>Two-wheel and motorcycle GPS units with JT808 firmware</Li>
                <Li>Fleet management terminals with JT808 support</Li>
            </ul>
            <P>Check your device manual to confirm JT808 support and locate the server IP and port configuration fields.</P>

            <H2>What the Platform Captures</H2>
            <P>Once connected, the following data is processed automatically:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Location</strong> — latitude, longitude, heading, speed</Li>
                <Li><strong>Battery / power voltage</strong> — where reported by the device</Li>
                <Li><strong>Alarm flags</strong> — SOS, low battery, geofence exit (device-side flags)</Li>
                <Li><strong>Heartbeats</strong> — keep-alive signals confirming the device is online</Li>
            </ul>
            <P>Data flows from the TCP connection into a processing queue where it is stored as snapshots in the database and as time-series in InfluxDB for historical analysis.</P>

            <H2>First-Time Device Registration</H2>
            <P>When a new device connects for the first time its IMEI is recorded and the device appears as <strong>Pending</strong> in the admin panel. A platform administrator must approve it before live data is displayed in the tenant portal.</P>
            <P>After approval the device is immediately active and assignable to an operator or beat zone.</P>

            <H2>Sending Commands</H2>
            <P>Supported command types (sent from the admin panel or via workflow automation):</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Location request</strong> — ask the device for an immediate position update</Li>
                <Li><strong>Reset / reboot</strong> — restart the device firmware</Li>
                <Li><strong>Parameter update</strong> — change reporting interval, server address</Li>
            </ul>
            <P>Commands are queued and delivered over the active TCP connection. If the device is offline, commands are held and delivered when it reconnects.</P>

            <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                <strong className="text-foreground">Need to connect a device that isn&apos;t JT808?</strong>
                {' '}See the{' '}
                <Link href="/docs/tad101" className="text-primary hover:underline">TAD101 Protocol</Link>
                {' '}for WebSocket-based connections from Android, iOS, Arduino, and Raspberry Pi.
            </div>
        </main>
    );
}
