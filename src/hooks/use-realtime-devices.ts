'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import type { Device } from '@/lib/api-client';

export type DeviceMap = Record<number, Device>;

interface DeviceUpdatedPayload {
    id: number;
    imei: string;
    name: string;
    status?: string;
    last_lat?: number | null;
    last_lon?: number | null;
    battery_level?: number | null;   // server key
    last_seen_at?: string | null;
}

interface SignalPayload {
    device_id: number;
    lat: number;
    lng: number;                     // server uses lng
    battery?: number | null;
    is_online: boolean;
    last_seen_at: string;
}

/**
 * Subscribes to private-user.{userId}.devices and private-user.{userId}.device-logs
 * via Soketi (Pusher-compatible). Merges real-time updates onto the initial device list.
 *
 * Auth: passes the Passport Bearer token in Pusher's auth.headers so the
 * /api/pusher/auth proxy can forward it to the server.
 */
export function useRealtimeDevices(
    initialDevices: Device[],
    token: string | null,
    userId: string | number | null,
) {
    const [devices, setDevices] = useState<DeviceMap>(() =>
        Object.fromEntries(initialDevices.map(d => [d.id, d]))
    );
    const [connected, setConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<string | null>(null);
    const pusherRef = useRef<Pusher | null>(null);

    // Re-seed when initial devices change (e.g. after a refetch)
    useEffect(() => {
        setDevices(Object.fromEntries(initialDevices.map(d => [d.id, d])));
    }, [initialDevices]);

    useEffect(() => {
        if (!token || !userId || String(userId) === '0') return;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
            wsHost:            process.env.NEXT_PUBLIC_PUSHER_HOST,
            wsPort:            Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 443),
            wssPort:           Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 443),
            cluster:           process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'mt1',
            forceTLS:          (process.env.NEXT_PUBLIC_PUSHER_SCHEME ?? 'https') === 'https',
            authEndpoint:      '/api/pusher/auth',
            disableStats:      true,
            enabledTransports: ['ws', 'wss'],
            auth: {
                // Forward the Bearer token so the auth proxy can validate the user
                headers: { Authorization: `Bearer ${token}` },
            },
        });

        pusherRef.current = pusher;
        pusher.connection.bind('connected',    () => setConnected(true));
        pusher.connection.bind('disconnected', () => setConnected(false));
        pusher.connection.bind('failed',       () => setConnected(false));

        // ── Channel 1: device metadata / status ────────────────────────────
        const devCh = pusher.subscribe(`private-user.${userId}.devices`);

        devCh.bind('device.updated', (data: DeviceUpdatedPayload) => {
            setDevices(prev => ({
                ...prev,
                [data.id]: {
                    ...prev[data.id],
                    ...data,
                    battery_percent: data.battery_level ?? prev[data.id]?.battery_percent ?? null,
                },
            }));
            setLastEvent(`${data.name ?? `#${data.id}`} updated`);
        });

        devCh.bind('device.onboarded', (data: DeviceUpdatedPayload) => {
            setDevices(prev => ({
                ...prev,
                [data.id]: { ...prev[data.id], ...data, status: 'active' },
            }));
            setLastEvent(`Device ${data.imei} onboarded`);
        });

        // ── Channel 2: real-time GPS signals ───────────────────────────────
        const logCh = pusher.subscribe(`private-user.${userId}.device-logs`);

        logCh.bind('device.signal.received', (data: SignalPayload) => {
            setDevices(prev => {
                const existing = prev[data.device_id];
                if (!existing) return prev;
                return {
                    ...prev,
                    [data.device_id]: {
                        ...existing,
                        last_lat:        data.lat,
                        last_lon:        data.lng,
                        battery_percent: data.battery ?? existing.battery_percent,
                        status:          data.is_online ? 'active' : 'offline',
                        last_seen_at:    data.last_seen_at,
                    },
                };
            });
            setLastEvent(`Signal from #${data.device_id}`);
        });

        return () => {
            devCh.unbind_all();
            logCh.unbind_all();
            pusher.unsubscribe(`private-user.${userId}.devices`);
            pusher.unsubscribe(`private-user.${userId}.device-logs`);
            pusher.disconnect();
            setConnected(false);
        };
    }, [token, userId]);

    return {
        devices,
        deviceList: Object.values(devices),
        connected,
        lastEvent,
    };
}
