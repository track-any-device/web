'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident } from '@/lib/api-client';
import DevicesView from './devices-view';

export default function DevicesClient() {
    const { token } = useAuth();
    const [devices, setDevices] = useState<Device[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        Promise.allSettled([
            api.devices(),
            api.incidents({ status: 'open,acknowledged,escalated', per_page: '50' }),
        ])
            .then(([devicesRes, incidentsRes]) => {
                setDevices(devicesRes.status === 'fulfilled' ? devicesRes.value.data : []);
                setIncidents(incidentsRes.status === 'fulfilled' ? incidentsRes.value.data : []);
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

    return <DevicesView devices={devices} incidents={incidents} token={token!} />;
}
