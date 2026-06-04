import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'User Manual | Track Any Device' };

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
function Note({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            {children}
        </div>
    );
}

export default function UserManual() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <span>User Manual</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 1 — Platform Manuals</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">User Manual</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    Everything an end user needs to track their devices, monitor alerts, and manage their account on Track Any Device.
                </p>
            </header>

            <H2>1. Signing In</H2>
            <P>Track Any Device uses a central single sign-on (SSO) system. You sign in once and gain access to all services you are authorised for.</P>
            <ol className="mt-3 list-decimal pl-5 space-y-1">
                <Li>Navigate to <strong>track-any-device.com/my</strong></Li>
                <Li>Click <strong>Sign in</strong> — you will be redirected to the login page</Li>
                <Li>Enter your email and password</Li>
                <Li>If two-factor authentication is enabled on your account, enter the SMS code sent to your registered number</Li>
                <Li>You are returned to the My portal</Li>
            </ol>
            <Note>First-time users must be registered by an administrator. Contact your organisation&apos;s admin or the platform team to receive an invitation.</Note>

            <H2>2. The My Portal</H2>
            <P>The My portal (<strong>track-any-device.com/my</strong>) is your personal dashboard. It shows:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>My Devices</strong> — all tracking devices registered to your account</Li>
                <Li><strong>Incidents</strong> — alerts triggered by your devices (zone exits, SOS, low battery)</Li>
                <Li><strong>Organizations</strong> — tenant portals your account belongs to</Li>
            </ul>

            <H2>3. Adding a Device</H2>
            <P>Each physical tracker has a unique IMEI printed on the device or its packaging.</P>
            <ol className="mt-3 list-decimal pl-5 space-y-1">
                <Li>Go to <strong>My Devices → Add Device</strong></Li>
                <Li>Enter the device IMEI</Li>
                <Li>Choose your relationship: <em>Owner</em>, <em>Custodian</em>, or <em>Follower</em></Li>
                <Li>Click <strong>Add</strong> — the device appears in your list immediately</Li>
            </ol>
            <Note>A device must first be registered and approved on the platform by an administrator before you can add it to your account.</Note>

            <H2>4. Live Tracking</H2>
            <P>Once a device is active and sending signals it appears on the live map inside the tenant portal your organisation has set up. From your My portal you can see the last known position, battery level, and signal time for each of your devices.</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Last position</strong> — shown on the Devices list as a latitude/longitude pair and last update time</Li>
                <Li><strong>Battery</strong> — shown as a percentage; devices below 20 % display a warning</Li>
                <Li><strong>Live map</strong> — available inside your tenant portal (see Organizations)</Li>
            </ul>

            <H2>5. Incidents</H2>
            <P>An incident is raised automatically when a device breaches a monitored condition:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Geofence exit</strong> — device left an Inclusion Zone (patrol beat)</Li>
                <Li><strong>Geofence entry</strong> — device entered an Exclusion Zone (restricted area)</Li>
                <Li><strong>SOS alarm</strong> — device triggered an emergency signal</Li>
                <Li><strong>Low battery</strong> — device battery fell below the configured threshold</Li>
            </ul>
            <H3>Incident statuses</H3>
            <ul className="mt-2 list-disc pl-5 space-y-1">
                <Li><strong>Open</strong> — newly raised, requires attention</Li>
                <Li><strong>Acknowledged</strong> — reviewed by an operator</Li>
                <Li><strong>Escalated</strong> — promoted to a higher priority</Li>
                <Li><strong>Resolved</strong> — closed by an operator</Li>
            </ul>
            <P>You can view your incidents in the My portal under <strong>Incidents</strong>. Operators inside your tenant portal manage and resolve them.</P>

            <H2>6. Organizations</H2>
            <P>If your account belongs to one or more tenant organizations, they are listed under <strong>Organizations</strong> in your My portal. Each card links directly to that organization&apos;s operational portal where you can view the live map, beats, and fleet-wide incidents.</P>

            <H2>7. Mobile App</H2>
            <P>The Track Any Device mobile app (TAD) is available for Android and iOS. It turns your phone into a tracking device so your location can be shared with your organization&apos;s portal in real time.</P>
            <ol className="mt-3 list-decimal pl-5 space-y-1">
                <Li>Install the TAD app from the App Store or Google Play</Li>
                <Li>Sign in with your existing account — no separate registration needed</Li>
                <Li>Grant location permission when prompted</Li>
                <Li>Toggle <strong>Start tracking</strong> — your phone begins streaming location to the platform</Li>
                <Li>Toggle <strong>Stop tracking</strong> when finished</Li>
            </ol>
            <Note>Background location is required for tracking to continue when the app is minimised. Enable <em>Allow always</em> in your phone&apos;s location settings for uninterrupted tracking.</Note>

            <H2>8. Account Settings</H2>
            <P>Account settings are managed at <strong>login.track-any-device.com</strong> after signing in:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Profile</strong> — update your name and email address</Li>
                <Li><strong>Phone / 2FA</strong> — register or update your mobile number for two-factor authentication</Li>
                <Li><strong>Security</strong> — change your password or manage active sessions</Li>
            </ul>

            <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                <strong className="text-foreground">Need help?</strong>
                {' '}Contact your organization administrator, or use the{' '}
                <Link href="/contact" className="text-primary hover:underline">contact form</Link> to reach the platform team.
            </div>
        </main>
    );
}
