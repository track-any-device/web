'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeDevices } from '@/hooks/use-realtime-devices';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident, Beat } from '@/lib/api-client';
import DevicesView from './devices-view';

export default function DevicesClient() {
    const { token, user } = useAuth();
    const userId = String(user?.sub ?? '0');

    const [initialDevices, setInitialDevices] = useState<Device[]>([]);
    const [incidents,      setIncidents]      = useState<Incident[]>([]);
    const [beats,          setBeats]          = useState<Beat[]>([]);
    const [loading,        setLoading]        = useState(true);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        Promise.allSettled([
            api.devices(),
            api.incidents({ status: 'open,acknowledged,escalated', per_page: '50' }),
            api.beats(),
        ])
            .then(([devicesRes, incidentsRes, beatsRes]) => {
                setInitialDevices(devicesRes.status     === 'fulfilled' ? devicesRes.value.data   : []);
                setIncidents(incidentsRes.status === 'fulfilled' ? incidentsRes.value.data         : []);
                setBeats(beatsRes.status         === 'fulfilled' ? beatsRes.value.data             : []);
            })
            .finally(() => setLoading(false));
    }, [token]);

    // Real-time updates via Soketi — merges live signals onto the initial snapshot
    const { deviceList, connected } = useRealtimeDevices(initialDevices, token, userId);

    if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

    return (
        <DevicesView
            devices={deviceList}
            incidents={incidents}
            beats={beats}
            token={token!}
            realtimeConnected={connected}
        />
    );
}
