'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { Incident, Beat } from '@/lib/api-client';
import { useRealtimeDevicesContext } from '../realtime-devices-context';
import DevicesView from './devices-view';
import RegisterDeviceModal from './register-device-modal';

type DevicesTab = 'assets' | 'beats' | 'trips';

export default function DevicesClient({ initialTab = 'assets' }: { initialTab?: DevicesTab }) {
    const { token } = useAuth();

    // Device list + socket come from the persistent shell context — loaded ONCE and kept
    // alive across navigation. This page only fetches its own incidents + beats.
    const { deviceList, connected, pulses, devicesLoading, reseedDevices } = useRealtimeDevicesContext();

    const [incidents,    setIncidents]    = useState<Incident[]>([]);
    const [beats,        setBeats]        = useState<Beat[]>([]);
    const [pageLoading,  setPageLoading]  = useState(true);
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        Promise.allSettled([
            api.incidents({ days: '3', per_page: '100' }),
            api.beats(),
        ])
            .then(([incidentsRes, beatsRes]) => {
                setIncidents(incidentsRes.status === 'fulfilled' ? incidentsRes.value.data : []);
                setBeats(beatsRes.status         === 'fulfilled' ? beatsRes.value.data     : []);
            })
            .finally(() => setPageLoading(false));
    }, [token]);

    const loading = devicesLoading || pageLoading;

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    function handleRegistered(_deviceId: number) {
        // Reload the shared device list after a new one is registered.
        setShowRegister(false);
        reseedDevices();
    }

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    return (
        <>
            <DevicesView
                devices={deviceList}
                incidents={incidents}
                initialBeats={beats}
                token={token!}
                realtimeConnected={connected}
                pulses={pulses}
                onRegisterClick={() => setShowRegister(true)}
                initialTab={initialTab}
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
