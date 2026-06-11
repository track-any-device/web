'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeDevices } from '@/hooks/use-realtime-devices';
import { ApiClient } from '@/lib/api-client';
import type { Device, Incident, Beat } from '@/lib/api-client';
import DevicesView from './devices-view';
import RegisterDeviceModal from './register-device-modal';

export default function DevicesClient() {
    const { token, user } = useAuth();
    const userId = String(user?.id ?? user?.sub ?? '0');

    const [initialDevices, setInitialDevices] = useState<Device[]>([]);
    const [incidents,      setIncidents]      = useState<Incident[]>([]);
    const [beats,          setBeats]          = useState<Beat[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [showRegister,   setShowRegister]   = useState(false);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        Promise.allSettled([
            api.devices(),
            api.incidents({ days: '3', per_page: '100' }),
            api.beats(),
        ])
            .then(([devicesRes, incidentsRes, beatsRes]) => {
                setInitialDevices(devicesRes.status === 'fulfilled' ? devicesRes.value.data   : []);
                setIncidents(incidentsRes.status   === 'fulfilled' ? incidentsRes.value.data  : []);
                setBeats(beatsRes.status           === 'fulfilled' ? beatsRes.value.data       : []);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const { deviceList, connected } = useRealtimeDevices(initialDevices, token, userId);

    function handleRegistered(deviceId: number) {
        // Reload devices after a new one is registered
        setShowRegister(false);
        if (!token) return;
        new ApiClient(token).devices()
            .then(res => setInitialDevices(res.data))
            .catch(() => {});
    }

    if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

    return (
        <>
            <DevicesView
                devices={deviceList}
                incidents={incidents}
                initialBeats={beats}
                token={token!}
                realtimeConnected={connected}
                onRegisterClick={() => setShowRegister(true)}
            />
            {showRegister && token && (
                <RegisterDeviceModal
                    token={token}
                    onClose={() => setShowRegister(false)}
                    onRegistered={handleRegistered}
                />
            )}
        </>
    );
}
