import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';

export const metadata: Metadata = { title: 'Signal Forwarding (REST & MQTT) | Track Any Device' };

/* For Business — how an organisation receives its devices' signals into its own systems.
   No real endpoints/credentials are shown; secrets are written as XX. */

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
  return <code className="rounded bg-muted px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[0.85em]">{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-6 font-[family-name:var(--font-mono)] text-foreground">
      {children}
    </pre>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
      {children}
    </div>
  );
}

const PAYLOAD = `{
  "DeviceName": "Toyota Corolla",
  "AccountName": "Skyline Logistics",
  "Latitude": 24.8607,
  "Longitude": 67.0011,
  "Temperature": 22.5,
  "Humidity": null,
  "Battery": 80
}`;

const REST_CONFIG = `Endpoint   https://XX/api/v1/ExternalDevice/UpdateLocationDevice
Method     POST
Headers    x-api-key: XX
Params     (optional static query/body params)`;

const MQTT_CONFIG = `Host       XX
Port       8883
Topic      tad/{your-org-slug}/locations
Username   XX
Password   XX
TLS        on
QoS        1`;

export default function ForwardingDoc() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link href="/docs" className="hover:text-primary">Docs</Link>
        <span className="mx-1.5">/</span>
        <span>Signal forwarding</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">For business</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Signal forwarding</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Receive your devices&rsquo; live signals directly into your own systems — over REST API or MQTT —
          in addition to (or instead of) tracking them in Track Any Device.
        </p>
      </header>

      <H2>Overview</H2>
      <P>
        Every organisation chooses how its device signals are delivered. Your Track Any Device administrator
        configures forwarding per organisation; you don&rsquo;t need to change anything on the devices.
      </P>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <Li><strong>TAD101 channel</strong> — the default. Signals broadcast in real time over the platform&rsquo;s WebSocket channel (no external setup).</Li>
        <Li><strong>REST API</strong> — Track Any Device sends an HTTP <Code>POST</Code> to your endpoint for each signal.</Li>
        <Li><strong>MQTT</strong> — Track Any Device publishes each signal to a topic on your MQTT broker.</Li>
      </ul>
      <Note>
        Forwarding is best-effort and queued: deliveries are retried on transient failures, and your
        administrator can see a per-organisation delivery log with success rate, latency, and the last error.
      </Note>

      <H2>What gets forwarded</H2>
      <P>Two signal types are forwarded as they arrive from a device:</P>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <Li><strong>location</strong> — a GPS fix (position, speed, battery, sensors).</Li>
        <Li><strong>heartbeat</strong> — a keep-alive with battery / status.</Li>
      </ul>

      <H2>The payload</H2>
      <P>
        Each forwarded signal is delivered as JSON. The default field set is below; the keys and which device
        fields they map to are configurable per organisation (see <Link href="#field-mapping" className="text-primary hover:underline">Field mapping</Link>).
      </P>
      <Pre>{PAYLOAD}</Pre>
      <P>Fields with no value for a given signal are sent as <Code>null</Code>.</P>

      <H2>REST API</H2>
      <P>
        Your administrator sets the destination endpoint, HTTP method, and any headers needed to authenticate
        (for example an API key). Track Any Device <Code>POST</Code>s the JSON payload above to your endpoint per signal.
      </P>
      <Pre>{REST_CONFIG}</Pre>
      <P>
        Authentication is whatever your endpoint expects, passed as a header (e.g. <Code>x-api-key: XX</Code> or
        <Code> Authorization: Bearer XX</Code>). Respond with a <Code>2xx</Code> status to acknowledge receipt;
        non-2xx responses are retried.
      </P>
      <Note>Endpoints and keys above are placeholders — real values (shown here as <Code>XX</Code>) are provided by your administrator and stored encrypted.</Note>

      <H2>MQTT</H2>
      <P>
        Track Any Device connects to your broker and publishes the same JSON payload to your topic. Credentials
        and TLS are configured per organisation.
      </P>
      <Pre>{MQTT_CONFIG}</Pre>

      <H2 >{/* anchor */}<span id="field-mapping" />Field mapping</H2>
      <P>
        The payload keys map to Track Any Device fields. Defaults are shown below; your administrator can rename
        keys or remap them to other available fields.
      </P>
      <table className="my-4 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Payload key</th>
            <th className="py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b border-border/60"><td className="py-2 pr-4"><Code>DeviceName</Code></td><td className="py-2">Device name</td></tr>
          <tr className="border-b border-border/60"><td className="py-2 pr-4"><Code>AccountName</Code></td><td className="py-2">Organisation name</td></tr>
          <tr className="border-b border-border/60"><td className="py-2 pr-4"><Code>Latitude</Code> / <Code>Longitude</Code></td><td className="py-2">GPS position</td></tr>
          <tr className="border-b border-border/60"><td className="py-2 pr-4"><Code>Temperature</Code></td><td className="py-2">Sensor temperature (when available)</td></tr>
          <tr className="border-b border-border/60"><td className="py-2 pr-4"><Code>Humidity</Code></td><td className="py-2">Unmapped by default</td></tr>
          <tr><td className="py-2 pr-4"><Code>Battery</Code></td><td className="py-2">Battery percentage</td></tr>
        </tbody>
      </table>

      <H2>Getting set up</H2>
      <P>
        Ask your Track Any Device administrator to enable forwarding for your organisation and choose the transport.
        For REST, share your endpoint URL and the header/key it expects; for MQTT, share your broker host, port, topic,
        and credentials. Once enabled, signals begin forwarding immediately and you can verify delivery from the
        organisation&rsquo;s forwarding activity log.
      </P>
    </main>
  );
}
