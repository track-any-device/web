import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Engineers Manual | Track Any Device' };

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
function Note({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            {children}
        </div>
    );
}

export default function EngineersManual() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <span>Engineers Manual</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 1 — Platform Manuals</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Engineers Manual</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    Deployment, configuration, and operations guide for engineers running the Track Any Device platform.
                </p>
            </header>

            <H2>1. Platform Architecture</H2>
            <P>The platform runs as a set of Docker containers orchestrated by Docker Compose. Each surface is a separate container image pulled from Docker Hub:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><Code>server-login</Code> — SSO identity provider (Passport, Fortify)</Li>
                <Li><Code>server-admin</Code> — Filament admin panel</Li>
                <Li><Code>server-api</Code> — central REST API (mobile, tenant portal, my portal)</Li>
                <Li><Code>server-graphql</Code> — GraphQL API and Explorer</Li>
                <Li><Code>server-tenant</Code> — per-tenant operational portal (one container per tenant)</Li>
                <Li><Code>server-cron</Code> — Laravel scheduler (offline detection, workflow triggers)</Li>
                <Li><Code>server-queue</Code> — Laravel queue worker (signal processing, jobs)</Li>
                <Li><Code>jt808-server</Code> — JT808 GPS TCP server (Go)</Li>
            </ul>
            <P>Infrastructure: MySQL 8.0, Redis 7, Soketi (WebSocket), InfluxDB (telemetry), Cloudflare Tunnel (routing).</P>
            <P>The web frontend (<Code>track-any-device.com</Code>) is deployed separately to Cloudflare Pages.</P>

            <H2>2. Installation</H2>
            <P>The install script handles the full setup interactively:</P>
            <Pre>{`mkdir tad && cd tad
curl -fsSL https://raw.githubusercontent.com/track-any-device/.github/main/install.sh | bash`}</Pre>
            <P>The script will prompt for:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Domain</strong> — your main domain (e.g. <Code>your-company.com</Code>)</Li>
                <Li><strong>Database</strong> — name and user (passwords auto-generated)</Li>
                <Li><strong>Cloudflare Tunnel token</strong> — from Zero Trust dashboard</Li>
                <Li><strong>SMS Gateway</strong> — optional, for 2FA OTP delivery</Li>
            </ul>
            <P>All other secrets (app keys, Pusher credentials, Passport RSA keys, InfluxDB tokens) are auto-generated. After confirming, it:</P>
            <ol className="mt-3 list-decimal pl-5 space-y-1">
                <Li>Writes a complete <Code>.env</Code> with no placeholders</Li>
                <Li>Generates <Code>docker-compose.yml</Code></Li>
                <Li>Pulls all images and starts the stack</Li>
                <Li>Waits for MySQL and API container to be ready</Li>
                <Li>Runs <Code>migrate</Code> + <Code>db:seed</Code> automatically</Li>
            </ol>

            <H2>3. Updating</H2>
            <P>Pull the latest images, apply new migrations, and restart changed services:</P>
            <Pre>{`bash ~/tad/install.sh --update`}</Pre>
            <P>This is safe to run at any time. It regenerates the compose file with the latest image tags and runs <Code>migrate --force</Code> automatically.</P>

            <H2>4. Cloudflare Tunnel</H2>
            <P>Go to <strong>Zero Trust → Networks → Tunnels → your tunnel → Public Hostnames</strong> and add:</P>
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                    <thead className="bg-muted/60 font-semibold">
                        <tr>
                            <th className="px-3 py-2 text-left">Subdomain</th>
                            <th className="px-3 py-2 text-left">Service</th>
                            <th className="px-3 py-2 text-left">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        <tr><td className="px-3 py-2">login</td><td className="px-3 py-2">http://login:80</td><td className="px-3 py-2">SSO</td></tr>
                        <tr><td className="px-3 py-2">admin</td><td className="px-3 py-2">http://admin:80</td><td className="px-3 py-2">Filament</td></tr>
                        <tr><td className="px-3 py-2">api</td><td className="px-3 py-2">http://api:80</td><td className="px-3 py-2">REST API</td></tr>
                        <tr><td className="px-3 py-2">graphql</td><td className="px-3 py-2">http://graphql:80</td><td className="px-3 py-2">GraphQL</td></tr>
                        <tr><td className="px-3 py-2">ws</td><td className="px-3 py-2">http://soketi:6001</td><td className="px-3 py-2">WebSocket — enable WS in settings</td></tr>
                        <tr><td className="px-3 py-2">{'{slug}'}</td><td className="px-3 py-2">http://tenant_{'{slug}'}:80</td><td className="px-3 py-2">One per tenant</td></tr>
                    </tbody>
                </table>
            </div>
            <P>The root domain (<Code>your-company.com</Code>) is served by Cloudflare Pages — no tunnel entry needed.</P>
            <Note>JT808 TCP (:7018) cannot route through Cloudflare Tunnel. Use the frp profile (<Code>docker compose --profile frp up -d</Code>) or Cloudflare Spectrum (Business plan) to expose the TCP port.</Note>

            <H2>5. Adding a Tenant Portal</H2>
            <P>Each tenant gets their own <Code>server-tenant</Code> container:</P>
            <ol className="mt-3 list-decimal pl-5 space-y-1">
                <Li>Approve the tenant in the admin panel → copy the generated API key and SSO client credentials from the Portal API Keys tab</Li>
                <Li>Add a service block to <Code>~/tad/docker-compose.yml</Code> following the commented example at the bottom of the file</Li>
                <Li>Run <Code>docker compose up -d tenant_{'{slug}'}</Code></Li>
                <Li>Add a Cloudflare Tunnel ingress rule: <Code>{'{slug}'}.your-domain.com → http://tenant_{'{slug}'}:80</Code></Li>
            </ol>

            <H2>6. Running Artisan Commands</H2>
            <P>Use the <Code>api</Code> container (it has the full app code):</P>
            <Pre>{`docker compose exec -w /var/www/html api php artisan <command>`}</Pre>
            <P>Common commands:</P>
            <Pre>{`# Re-run all migrations and seed
php artisan migrate:fresh --seed --force

# Check migration status
php artisan migrate:status

# Manage queue workers
php artisan queue:restart

# Run offline detection manually
php artisan devices:detect-offline`}</Pre>
            <Note>The <Code>cli</Code> container is a tools-only image (PHP + Composer + pnpm). It does NOT have app code — always use <Code>api</Code> for artisan commands on a production install.</Note>

            <H2>7. JT808 Device Provisioning</H2>
            <P>When a GPS tracker connects to port <Code>7018</Code> for the first time with an unknown IMEI, it is auto-created as a <strong>pending</strong> device in the admin panel. An administrator must approve it before signal data is processed.</P>
            <P>To approve: Admin panel → Devices → find the pending device → Approve. Once approved, signals flow into the queue worker and are stored in MySQL (latest snapshot) and InfluxDB (history).</P>

            <H2>8. Monitoring</H2>
            <P>Optional logging stack (Grafana + Loki + Promtail):</P>
            <Pre>{`docker compose --profile logging up -d
# Grafana → http://localhost:3000`}</Pre>
            <P>JT808 server exposes Prometheus metrics at <Code>:9090/metrics</Code> — connection counts, frame throughput, SOS alarms, decode errors.</P>

            <H2>9. Backup</H2>
            <P>Critical data to back up:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>MySQL data volume</strong> — <Code>docker run --rm -v tad_mysql_data:/data busybox tar czf - /data</Code></Li>
                <Li><strong><Code>~/tad/.env</Code></strong> — contains all generated secrets including Passport RSA keys</Li>
                <Li><strong>InfluxDB volume</strong> — <Code>tad_influxdb_data</Code> (telemetry history)</Li>
            </ul>
            <P>The <Code>.env</Code> file is the most critical — without the Passport private key, existing tokens cannot be validated and all users will need to re-authenticate.</P>

            <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                For architecture details, source repositories, and contribution guidelines see the{' '}
                <Link href="https://github.com/track-any-device/.github" className="text-primary hover:underline">
                    platform organisation on GitHub
                </Link>.
            </div>
        </main>
    );
}
