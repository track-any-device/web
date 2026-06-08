import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Shop API — Products | Track Any Device' };

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

export default function ShopProductsDocs() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <Link href="/docs/api/shop/products" className="hover:text-primary">Shop API</Link>
                {' / '}
                <span>Products</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 3 — API Reference</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Product Catalog</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    Browse available devices and accessories. These endpoints are public — no authentication required.
                </p>
            </header>

            <H2>Overview</H2>
            <P>The product catalog API lets anyone browse the devices and accessories available for purchase. Only active, in-stock products are returned. No authentication is required — these endpoints power the public shop pages.</P>

            <H2>Base URL</H2>
            <Pre>{`https://api.your-domain.com/api/shop/`}</Pre>

            <H2>Endpoints</H2>

            <H3>List products</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/api/shop/products" description="List all active, in-stock products." />
            </div>
            <P>Returns a paginated list of products. Each product includes its name, SKU, price, current stock count, image URLs, and the maximum quantity allowed per order.</P>

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
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>id</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Product ID</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>name</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Display name</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>sku</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Unique product SKU</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>price</Code></td><td className="px-3 py-2">string</td><td className="px-3 py-2">Price as a decimal string (e.g. &quot;4999.00&quot;)</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>stock</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Units currently available</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>images</Code></td><td className="px-3 py-2">string[]</td><td className="px-3 py-2">Array of image URLs</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>max_order_quantity</Code></td><td className="px-3 py-2">integer</td><td className="px-3 py-2">Maximum units per order before contact-sales is required</td></tr>
                        <tr className="border-b border-border"><td className="px-3 py-2"><Code>description</Code></td><td className="px-3 py-2">string|null</td><td className="px-3 py-2">Product description (detail endpoint only)</td></tr>
                        <tr><td className="px-3 py-2"><Code>productable</Code></td><td className="px-3 py-2">object|null</td><td className="px-3 py-2">Linked device type or accessory (detail endpoint only)</td></tr>
                    </tbody>
                </table>
            </div>

            <H3>Get product by SKU</H3>
            <div className="my-3 rounded-lg border border-border bg-card p-3">
                <Endpoint method="GET" path="/api/shop/products/{sku}" description="Get a single product by its SKU. Includes full description and linked productable." />
            </div>
            <P>Returns the full product detail including <Code>description</Code>, <Code>meta</Code>, and the <Code>productable</Code> relation (the device type or accessory this product represents).</P>

            <H2>Example — List Products</H2>
            <Pre>{`curl -X GET \\
  https://api.your-domain.com/api/shop/products \\
  -H "Accept: application/json"`}</Pre>

            <H3>Response</H3>
            <Pre>{`{
  "data": [
    {
      "id": 1,
      "name": "TAD-101 Personal Tracker",
      "sku": "TAD-101",
      "price": "4999.00",
      "stock": 48,
      "images": [
        "https://cdn.your-domain.com/products/tad-101-front.jpg"
      ],
      "max_order_quantity": 5
    }
  ],
  "total": 3,
  "current_page": 1,
  "last_page": 1,
  "per_page": 15
}`}</Pre>

            <H2>Example — Get Product Detail</H2>
            <Pre>{`curl -X GET \\
  https://api.your-domain.com/api/shop/products/TAD-101 \\
  -H "Accept: application/json"`}</Pre>

            <H3>Response</H3>
            <Pre>{`{
  "data": {
    "id": 1,
    "name": "TAD-101 Personal Tracker",
    "sku": "TAD-101",
    "price": "4999.00",
    "stock": 48,
    "images": [
      "https://cdn.your-domain.com/products/tad-101-front.jpg"
    ],
    "max_order_quantity": 5,
    "description": "Compact personal GPS tracker with 7-day battery life...",
    "meta": { "weight": "42g", "battery": "700mAh" },
    "productable": {
      "type": "device_type",
      "id": 3,
      "name": "TAD-101",
      "protocol": "tad101"
    }
  }
}`}</Pre>

            <div className="mt-12 flex gap-4 text-sm">
                <Link href="/docs/api/shop/checkout" className="text-primary hover:underline">Next: Checkout &rarr;</Link>
            </div>
        </main>
    );
}
