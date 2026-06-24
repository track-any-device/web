'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { Incident } from '@/lib/api-client';

const STATUS_BADGE: Record<string, { background: string; color: string }> = {
    open:         { background: 'var(--danger-bg)',  color: 'var(--danger)' },
    acknowledged: { background: 'var(--warning-bg)', color: 'var(--warning)' },
    escalated:    { background: 'var(--warning-bg)', color: 'var(--warning)' },
    resolved:     { background: 'var(--success-bg)', color: 'var(--success)' },
};

const PRIORITY_BADGE: Record<string, { background: string; color: string }> = {
    critical: { background: 'var(--danger-bg)',  color: 'var(--danger)' },
    high:     { background: 'var(--warning-bg)', color: 'var(--warning)' },
    medium:   { background: 'var(--warning-bg)', color: 'var(--warning)' },
    low:      { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' },
};

const STATUS_DOT: Record<string, string> = {
    open:         'var(--danger)',
    acknowledged: 'var(--warning)',
    escalated:    'var(--warning)',
    resolved:     'var(--success)',
    closed:       'var(--text-muted)',
};

export default function IncidentsClient() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get('status') ?? '';

    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.incidents(statusFilter ? { status: statusFilter } : undefined)
            .then((result) => {
                setIncidents(result.data);
                setTotal(result.total);
            })
            .catch(() => {
                setIncidents([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [token, statusFilter]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                    Incidents
                    <span className="ml-2" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-regular)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>({total})</span>
                </h1>
                {/* Status filter tabs */}
                <div className="flex gap-2">
                    {[
                        ['All', ''],
                        ['Open', 'open'],
                        ['Resolved', 'resolved'],
                    ].map(([label, status]) => (
                        <a key={label}
                            href={status ? `/my/incidents?status=${status}` : '/my/incidents'}
                            className={`tad-btn tad-btn--sm ${statusFilter === status ? 'tad-btn--primary' : 'tad-btn--secondary'}`}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {incidents.map((incident) => (
                    <div key={incident.id}
                        className="rounded-xl px-5 py-4"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_DOT[incident.status] ?? 'var(--text-muted)' }} />
                                    <span className="capitalize px-2 py-0.5 rounded-full"
                                        style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...(STATUS_BADGE[incident.status] ?? PRIORITY_BADGE.low) }}>
                                        {incident.status}
                                    </span>
                                    <span className="capitalize px-2 py-0.5 rounded-full"
                                        style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...(PRIORITY_BADGE[incident.priority] ?? PRIORITY_BADGE.low) }}>
                                        {incident.priority}
                                    </span>
                                    {incident.level > 1 && (
                                        <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>L{incident.level}</span>
                                    )}
                                </div>
                                <p className="capitalize" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>
                                    {incident.device?.name ?? '—'} — {incident.display_label ?? incident.event_type.replace(/_/g, ' ')}
                                </p>
                                {incident.beat && (
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Beat: {incident.beat.name}</p>
                                )}
                            </div>
                            <time className="shrink-0 whitespace-nowrap" style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                                {new Date(incident.triggered_at).toLocaleString()}
                            </time>
                        </div>
                    </div>
                ))}
                {incidents.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-16 gap-2">
                        <ShieldCheck className="w-7 h-7" style={{ color: 'var(--success)' }} />
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No incidents found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
