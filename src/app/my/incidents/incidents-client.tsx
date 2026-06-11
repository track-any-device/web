'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';
import type { Incident } from '@/lib/api-client';

const STATUS_BADGE: Record<string, string> = {
    open:         'bg-red-100 text-red-700',
    acknowledged: 'bg-yellow-100 text-yellow-700',
    escalated:    'bg-orange-100 text-orange-700',
    resolved:     'bg-green-100 text-green-700',
};

const PRIORITY_BADGE: Record<string, string> = {
    critical: 'bg-red-200 text-red-800',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-yellow-100 text-yellow-700',
    low:      'bg-gray-100 text-gray-600',
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

    if (loading) return <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-gray-400">Loading...</div>;

    return (
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incidents ({total})</h1>
                {/* Status filter tabs */}
                <div className="flex gap-2">
                    {[
                        ['All', ''],
                        ['Open', 'open'],
                        ['Resolved', 'resolved'],
                    ].map(([label, status]) => (
                        <a key={label}
                            href={status ? `/my/incidents?status=${status}` : '/my/incidents'}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                statusFilter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {incidents.map((incident) => (
                    <div key={incident.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[incident.status] ?? ''}`}>
                                        {incident.status}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[incident.priority] ?? ''}`}>
                                        {incident.priority}
                                    </span>
                                    {incident.level > 1 && (
                                        <span className="text-xs font-bold text-red-600">L{incident.level}</span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {incident.device?.name ?? '—'} — {incident.event_type}
                                </p>
                                {incident.beat && (
                                    <p className="text-xs text-gray-500">Beat: {incident.beat.name}</p>
                                )}
                            </div>
                            <time className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                                {new Date(incident.triggered_at).toLocaleString()}
                            </time>
                        </div>
                    </div>
                ))}
                {incidents.length === 0 && (
                    <div className="text-center py-16 text-gray-400">No incidents found.</div>
                )}
            </div>
        </div>
    );
}
