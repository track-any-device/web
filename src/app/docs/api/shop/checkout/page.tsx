import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Shop API — Checkout | Track Any Device' };

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

export default function ShopCheckoutDocs() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <Link href="/docs/api/shop/products" className="hover:text-primary">Shop API</Link>
                {' / '}
                <span>Checkout</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 3 — API Reference</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Checkout</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    Place a Cash on Delivery order. Requires authentication via a Passport bearer token.
                </p>
            </header>

            <H2>Overview</H2>
            <P><strong>Cash on Delivery (COD)</strong> is the only payment method. The billing address is always the same as the shipping address. After a successful checkout, the API returns the order with a unique <Code>claim_code</Code> that the buyer will use to register the device once it arrives.</P>

            <H2>Authentication</H2>
            <P>The checkout endpoint requires a Passport bearer token in the <Code>Authorization</Code> header:</P>
            <Pre>{`Authorization: Bearer {passport_access_token}`}</Pre>

            <H2>Endpoint</H2>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="POST" path="/api/shop/checkout" description="Place a Cash on Delivery order for one product." />
            </div>

            <H3>Request body</H3>
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 text-left">
                            <th className="px-3 py-2 font-medium">Field</th>
                            <th className="px-3 py-2 font-medium">Type</th>
                            <th className="px-3 py-2 font-medium">Required</th>
                            <th className="px-3 py-2 font-medium">Description</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>product_id</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">ID of the product to order</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>quantity</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">Number of units (1 &ndash; <Code>max_order_quantity</Code>)</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>shipping_name</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">Recipient&apos;s full name</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>shipping_phone</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">Recipient&apos;s phone number</td></tr>
                        <tr><td className="px-3 py-2"><Code>shipping_address</Code></td><td className="px-3 py-2">object</td><td className="px-3 py-2">Yes</td><td className="px-3 py-2">Shipping address (see below)</td></tr>
                    </tbody>
                </table>
            </div>

            <H3>Shipping address object</H3>
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
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>street</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Street address</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>city</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">City</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>state</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">State or province</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>postal_code</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Postal / ZIP code</td></tr>
                        <tr><td className="px-3 py-2"><Code>country</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Country name or ISO 3166-1 code</td></tr>
                    </tbody>
                </table>
            </div>

            <H2>Bulk Order Limit</H2>
            <P>Each product defines a <Code>max_order_quantity</Code>. If the requested <Code>quantity</Code> exceeds this limit, the API returns a <Code>422</Code> response with <Code>contact_required: true</Code>, prompting the buyer to contact sales for bulk pricing:</P>
            <Pre>{`{
  "message": "Quantity exceeds the maximum allowed for this product.",
  "errors": {
    "quantity": ["Exceeds max_order_quantity (5). Contact sales for bulk orders."]
  },
  "contact_required": true
}`}</Pre>

            <H2>Response</H2>
            <P>A successful checkout returns the created order with a <Code>201 Created</Code> status:</P>
            <Pre>{`{
  "data": {
    "id": 42,
    "reference": "ORD-000042",
    "status": "pending",
    "payment_method": "cod",
    "quantity": 1,
    "total": "4999.00",
    "claim_code": "A7X9K2M4",
    "shipping_name": "Ahmed Khan",
    "shipping_phone": "+923001234567",
    "shipping_address": {
      "street": "12 Mall Road",
      "city": "Lahore",
      "state": "Punjab",
      "postal_code": "54000",
      "country": "PK"
    },
    "product": {
      "id": 1,
      "name": "TAD-101 Personal Tracker",
      "sku": "TAD-101"
    },
    "created_at": "2026-06-08T10:30:00Z"
  }
}`}</Pre>

            <H2>Order Reference Numbers</H2>
            <P>Every order is assigned a reference number in the format <Code>ORD-000001</Code> (zero-padded to 6 digits). This reference is included in delivery packaging alongside the claim code.</P>

            <H2>Claim Code</H2>
            <P>The <Code>claim_code</Code> is a unique 8-character alphanumeric string generated at checkout. It is printed on the delivery packaging and used by the buyer to register the device after delivery. See the <Link href="/docs/api/shop/orders" className="text-primary hover:underline">Orders &amp; Claiming</Link> docs for the full claim flow.</P>

            <H2>Example — Place an Order</H2>
            <Pre>{`curl -X POST \\
  https://api.your-domain.com/api/shop/checkout \\
  -H "Authorization: Bearer eyJ0eXAiOi..." \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "product_id": 1,
    "quantity": 1,
    "shipping_name": "Ahmed Khan",
    "shipping_phone": "+923001234567",
    "shipping_address": {
      "street": "12 Mall Road",
      "city": "Lahore",
      "state": "Punjab",
      "postal_code": "54000",
      "country": "PK"
    }
  }'`}</Pre>

            <div className="mt-12 flex justify-between text-sm">
                <Link href="/docs/api/shop/products" className="text-primary hover:underline">&larr; Products</Link>
                <Link href="/docs/api/shop/orders" className="text-primary hover:underline">Orders &amp; Claiming &rarr;</Link>
            </div>
        </main>
    );
}
