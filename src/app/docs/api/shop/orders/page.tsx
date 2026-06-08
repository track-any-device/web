import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Shop API — Orders & Claiming | Track Any Device' };

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
    return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
    return (
        <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/60 px-4 py-3 font-mono text-xs leading-relaxed">
            {children}
        </pre>
    );
}
function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
    const colours: Record<string, string> = {
        GET:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    return (
        <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${colours[method] ?? 'bg-muted text-muted-foreground'}`}>
                {method}
            </span>
            <div>
                <code className="font-mono text-xs">{path}</code>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

export default function ShopOrdersDocs() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <Link href="/docs/api/shop/products" className="hover:text-primary">Shop API</Link>
                {' / '}
                <span>Orders &amp; Claiming</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 3 — API Reference</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Orders &amp; Device Claiming</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    View orders, retrieve claim codes, and register delivered devices to your account.
                </p>
            </header>

            <H2>Overview</H2>
            <P>After placing an order via the <Link href="/docs/api/shop/checkout" className="text-primary hover:underline">checkout endpoint</Link>, the buyer can track their order and — once the device arrives — claim it to add it to their account. Claiming links the physical device to the user&apos;s network.</P>

            <H2>Authentication</H2>
            <P>All order management endpoints require a Passport bearer token:</P>
            <Pre>{`Authorization: Bearer {passport_access_token}`}</Pre>
            <P>The one exception is the <strong>signed URL verification endpoint</strong> used for QR code scanning, which authenticates via the URL signature itself.</P>

            <H2>Endpoints</H2>

            <H3>List orders</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/api/my/orders" description="Paginated list of the authenticated user's orders." />
            </div>
            <P>Returns orders for the current user, newest first. Each order includes reference number, status, product summary, and claim status.</P>

            <H3>Get order detail</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/api/my/orders/{order}" description="Full order detail including product, shipping address, and claim code." />
            </div>

            <H3>Response fields</H3>
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 text-left">
                            <th className="px-3 py-2 font-medium">Field</th>
                            <th className="px-3 py-2 font-medium">Type</th>
                            <th className="px-3 py-2 font-medium">Description</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>id</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Order ID</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>reference</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Order reference (e.g. <Code>ORD-000042</Code>)</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>status</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Order status: pending, processing, shipped, delivered, claimed</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>payment_method</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Always <Code>cod</Code></td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>quantity</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Units ordered</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>total</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Total price as decimal string</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>claim_code</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">8-character alphanumeric claim code</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>claimed_at</Code></td><td className="px-3 py-2">string|null</td><td className="px-3 py-2">ISO 8601 timestamp when the device was claimed, or null</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>product</Code></td><td className="px-3 py-2">object</td><td className="px-3 py-2">Nested product summary (id, name, sku)</td></tr>
                        <tr><td className="px-3 py-2"><Code>shipping_address</Code></td><td className="px-3 py-2">object</td><td className="px-3 py-2">Shipping address (street, city, state, postal_code, country)</td></tr>
                    </tbody>
                </table>
            </div>

            <H2>Device Claiming</H2>
            <P>When a device is delivered, the buyer registers it to their account using the <strong>claim code</strong> printed on the packaging. There are two claim paths:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Manual entry</strong> — the user enters the 8-character code in the portal or via the API.</Li>
                <Li><strong>QR scan</strong> — the user scans a QR code on the packaging, which opens a signed URL that completes the claim automatically.</Li>
            </ul>
            <P>Both paths result in the same outcome: the device is added to the user&apos;s network via the <Code>user_devices</Code> pivot with <Code>relationship: owner</Code> and <Code>registered_at</Code> set to the current timestamp.</P>

            <H3>Path 1 — Manual claim</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="POST" path="/api/my/orders/{order}/claim" description="Submit the 8-character claim code to register the device." />
            </div>

            <H3>Request body</H3>
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 text-left">
                            <th className="px-3 py-2 font-medium">Field</th>
                            <th className="px-3 py-2 font-medium">Type</th>
                            <th className="px-3 py-2 font-medium">Description</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr><td className="px-3 py-2"><Code>claim_code</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">The 8-character alphanumeric code from the delivery packaging</td></tr>
                    </tbody>
                </table>
            </div>

            <P>Returns the updated order with <Code>claimed_at</Code> set and status changed to <Code>claimed</Code>.</P>

            <H3>Path 2 — QR code claim</H3>
            <P>The QR claim flow uses two endpoints: one to generate the QR data, and one to verify the scan.</P>

            <H3>Get claim QR data</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/api/my/orders/{order}/claim-qr" description="Returns a signed claim URL and claim code for QR generation." />
            </div>
            <P>The response includes a <Code>claim_url</Code> (a signed URL) and the <Code>claim_code</Code>. Encode the <Code>claim_url</Code> into a QR code for the buyer to scan.</P>

            <Pre>{`{
  "claim_url": "https://api.your-domain.com/api/shop/orders/42/claim/verify?signature=abc123...",
  "claim_code": "A7X9K2M4"
}`}</Pre>

            <H3>Verify claim via signed URL</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/api/shop/orders/{order}/claim/verify" description="Scanned from the delivery packaging QR code. Authenticates via URL signature — no Bearer token needed." />
            </div>
            <P>This endpoint is designed to be opened in a browser. It verifies the URL signature, validates the claim code embedded in the signed parameters, and adds the device to the user&apos;s network. No <Code>Authorization</Code> header is needed — the signed URL itself is the authentication.</P>

            <H2>Example — List Orders</H2>
            <Pre>{`curl -X GET \\
  https://api.your-domain.com/api/my/orders \\
  -H "Authorization: Bearer eyJ0eXAiOi..." \\
  -H "Accept: application/json"`}</Pre>

            <H2>Example — Claim a Device</H2>
            <Pre>{`curl -X POST \\
  https://api.your-domain.com/api/my/orders/42/claim \\
  -H "Authorization: Bearer eyJ0eXAiOi..." \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{"claim_code": "A7X9K2M4"}'`}</Pre>

            <H3>Response</H3>
            <Pre>{`{
  "data": {
    "id": 42,
    "reference": "ORD-000042",
    "status": "claimed",
    "claim_code": "A7X9K2M4",
    "claimed_at": "2026-06-08T14:22:00Z",
    "product": {
      "id": 1,
      "name": "TAD-101 Personal Tracker",
      "sku": "TAD-101"
    }
  }
}`}</Pre>

            <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                <strong className="text-foreground">Claim codes</strong> are single-use. Once a device is claimed, attempting to claim it again returns a <Code>422</Code> error. If the buyer loses their claim code, they should contact support with their order reference number.
            </div>

            <div className="mt-6 flex justify-between text-sm">
                <Link href="/docs/api/shop/checkout" className="text-primary hover:underline">&larr; Checkout</Link>
                <Link href="/docs" className="text-primary hover:underline">All docs &rarr;</Link>
            </div>
        </main>
    );
}
