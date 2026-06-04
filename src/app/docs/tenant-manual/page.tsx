import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Tenant Manual | Track Any Device' };

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
function Tip({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            {children}
        </div>
    );
}

export default function TenantManual() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
            <nav className="mb-8 text-xs text-muted-foreground">
                <Link href="/docs" className="hover:text-primary">Docs</Link>
                {' / '}
                <span>Tenant Manual</span>
            </nav>

            <header className="mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Section 1 — Platform Manuals</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Tenant Manual</h1>
                <p className="mt-3 text-base text-muted-foreground">
                    A guide for tenant operators running a fleet organisation — managing field personnel, patrol zones, incidents, and automated workflows.
                </p>
            </header>

            <H2>1. The Tenant Portal</H2>
            <P>Your organisation has its own operational portal at <strong>{'{your-slug}'}.track-any-device.com</strong>. This portal is where your team manages day-to-day fleet operations. Access it by signing in via the link your administrator provided, or from your My portal under Organizations.</P>
            <P>The portal contains:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Dashboard</strong> — summary of active devices, open incidents, and personnel</Li>
                <Li><strong>Live Map</strong> — real-time positions of all active devices</Li>
                <Li><strong>Devices</strong> — full device list with status, battery, and last signal</Li>
                <Li><strong>Incidents</strong> — active and historical alerts</Li>
                <Li><strong>Beats</strong> — patrol zones and restricted areas</Li>
                <Li><strong>Assignees</strong> — field personnel who carry or are associated with devices</Li>
            </ul>

            <H2>2. Assignees</H2>
            <P>An <strong>Assignee</strong> is a field operative, vehicle, or asset that can be assigned a tracking device. Assignees are the people and things your fleet monitors.</P>
            <H3>Creating an assignee</H3>
            <P>Assignees are managed from the admin panel by your organisation&apos;s administrator. Each assignee has a name, type (person, vehicle, asset), and contact information. Once created, a device can be assigned to them.</P>
            <H3>Device assignments</H3>
            <P>A device assignment links one device to one assignee for a period of time. When a device is assigned, its signals (location, battery, incidents) are attributed to that assignee. Assignments can be transferred or returned at any time from the admin panel.</P>

            <H2>3. Beats — Patrol Zones</H2>
            <P>A <strong>Beat</strong> is a geographic zone applied to devices. There are two types:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Inclusion Zone</strong> — the device must stay <em>inside</em>. An incident is raised if the device exits the zone.</Li>
                <Li><strong>Exclusion Zone</strong> — the device must stay <em>outside</em>. An incident is raised if the device enters the zone.</Li>
            </ul>
            <P>Zones can be polygon (free-draw), hexagon, or circle shaped. Beats support a parent–child hierarchy: a beat can have sub-beats, and violations escalate through the chain as the device moves further from its assigned area.</P>
            <H3>Assigning a device to a beat</H3>
            <P>From the admin panel: open the device record → Beat Assignments → Assign to beat. Only active beats are selectable. A device can be assigned to one beat at a time.</P>
            <Tip>Use Inclusion Zones for patrol routes and station areas. Use Exclusion Zones for restricted premises, school zones, or geofenced no-go areas.</Tip>

            <H2>4. Live Map</H2>
            <P>The Live Map updates in real time as devices send location signals. Each device marker shows:</P>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li>Device name and current status</Li>
                <Li>Battery percentage</Li>
                <Li>Last update timestamp</Li>
                <Li>Assigned beat zone outline (if active)</Li>
            </ul>
            <P>Click any marker to open the device detail panel. The map supports OpenStreetMap tiles and can be configured to use offline tile caches for areas with limited connectivity.</P>

            <H2>5. Incidents</H2>
            <P>Incidents are raised automatically when a device breaches a monitored condition. Your team must review, acknowledge, and resolve incidents to keep the incident queue clean.</P>
            <H3>Incident lifecycle</H3>
            <ol className="mt-3 list-decimal pl-5 space-y-1">
                <Li><strong>Open</strong> — raised automatically; requires operator action</Li>
                <Li><strong>Acknowledged</strong> — operator has reviewed it; monitoring continues</Li>
                <Li><strong>Escalated</strong> — severity promoted; additional notifications triggered</Li>
                <Li><strong>Resolved</strong> — operator closes with optional resolution notes</Li>
            </ol>
            <H3>Incident levels</H3>
            <P>For Inclusion Zone violations, incidents escalate by level as the device moves further outside its zone — Level 1 is just outside the assigned beat, Level 2 is outside the parent beat, and so on. Higher levels trigger more urgent notifications.</P>
            <H3>Managing incidents</H3>
            <P>From the Incidents view: filter by status, device, or date. Click an incident to see its detail — location, device, assignee, beat, timestamps, and history. Use the action buttons to acknowledge, escalate, or resolve. Resolution notes are stored permanently on the record.</P>

            <H2>6. Workflows</H2>
            <P>Workflows automate responses to incidents and time-based triggers without manual intervention.</P>
            <H3>Trigger types</H3>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Incident opened</strong> — fires when a new incident is created</Li>
                <Li><strong>Incident escalated</strong> — fires when an incident level increases</Li>
                <Li><strong>Time schedule</strong> — fires on a cron schedule (e.g. every 15 minutes)</Li>
            </ul>
            <H3>Actions</H3>
            <ul className="mt-3 list-disc pl-5 space-y-1">
                <Li><strong>Notify</strong> — send an in-platform notification to users or assignees</Li>
                <Li><strong>Escalate incident</strong> — automatically promote the incident status</Li>
                <Li><strong>Send command</strong> — send a command to the device (e.g. request location update)</Li>
                <Li><strong>Webhook</strong> — POST incident data to an external URL</Li>
                <Li><strong>Wait</strong> — pause the workflow for a set number of seconds before the next action</Li>
            </ul>
            <Tip>Example: When an SOS incident is opened → Notify supervisor immediately → Wait 3 minutes → If still open, Escalate → Notify all operators.</Tip>

            <H2>7. Reports and History</H2>
            <P>Historical signal data, incident logs, and assignment records are accessible from the admin panel. Signal history is retained for the configured retention period (default: 90 days in InfluxDB).</P>

            <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                <strong className="text-foreground">Admin functions not covered here</strong>
                {' '}(device onboarding, user management, beat creation, workflow configuration) are in the Filament admin panel at{' '}
                <strong>admin.track-any-device.com</strong>.
                Contact your platform engineer for access.
            </div>
        </main>
    );
}
