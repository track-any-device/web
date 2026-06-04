'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import type { Device } from '@/lib/api-client';

interface Props {
    initialDevices: Device[];
    userId: string;
}

type DeviceMap = Record<number, Device>;

const STATUS_DOT: Record<string, string> = {
    active:   'bg-green-500',
    inactive: 'bg-gray-400',
    offline:  'bg-red-500',
};

// Payload from DeviceUpdatedEvent (package-core)
interface DeviceUpdatedPayload {
    id: number;
    imei: string;
    name: string;
    status?: string;
    last_lat?: number | null;
    last_lon?: number | null;
    battery_level?: number | null;   // backend uses battery_level
    last_signal_at?: string | null;
    last_seen_at?: string | null;
    tenant_id?: number | null;
    user_id?: number | null;
}

// Payload from DeviceSignalReceived (app/Events)
interface SignalPayload {
    device_id: number;
    imei: string;
    lat: number;
    lng: number;                     // backend uses lng, Device type uses last_lon
    battery?: number | null;
    is_online: boolean;
    last_seen_at: string;
    tenant_id?: number | null;
    user_id?: number | null;
}

export default function StreamClient({ initialDevices, userId }: Props) {
    const [devices, setDevices] = useState<DeviceMap>(() =>
        Object.fromEntries(initialDevices.map(d => [d.id, d]))
    );
    const [connected, setConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<string | null>(null);
    const [updatedId, setUpdatedId] = useState<number | null>(null);
    const pusherRef = useRef<Pusher | null>(null);

    function flash(id: number, label: string) {
        setUpdatedId(id);
        setLastEvent(label);
        setTimeout(() => setUpdatedId(null), 1500);
    }

    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
            wsHost:           process.env.NEXT_PUBLIC_PUSHER_HOST,
            wsPort:           Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 443),
            wssPort:          Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 443),
            cluster:          process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'mt1',
            forceTLS:         (process.env.NEXT_PUBLIC_PUSHER_SCHEME ?? 'https') === 'https',
            authEndpoint:     '/api/pusher/auth',
            disableStats:     true,
            enabledTransports: ['ws', 'wss'],
        });

        pusherRef.current = pusher;
        pusher.connection.bind('connected',    () => setConnected(true));
        pusher.connection.bind('disconnected', () => setConnected(false));
        pusher.connection.bind('failed',       () => setConnected(false));

        // ── Channel 1: device status & location updates ──────────────────────
        // DeviceUpdatedEvent + DeviceOnboardedEvent from package-core
        const devicesChannel = pusher.subscribe(`private-user.${userId}.devices`);

        devicesChannel.bind('device.updated', (data: DeviceUpdatedPayload) => {
            setDevices(prev => ({
                ...prev,
                [data.id]: {
                    ...prev[data.id],
                    ...data,
                    // Map backend battery_level → frontend battery_percent
                    battery_percent: data.battery_level ?? prev[data.id]?.battery_percent ?? null,
                },
            }));
            flash(data.id, `${data.name ?? `#${data.id}`} updated`);
        });

        devicesChannel.bind('device.onboarded', (data: { id: number; imei: string }) => {
            setDevices(prev => ({
                ...prev,
                [data.id]: { ...prev[data.id], ...data, status: 'active' },
            }));
            flash(data.id, `Device ${data.imei} onboarded`);
        });

        // ── Channel 2: real-time GPS signals ─────────────────────────────────
        // DeviceSignalReceived from app/Events — lat/lng, battery, is_online
        const logsChannel = pusher.subscribe(`private-user.${userId}.device-logs`);

        logsChannel.bind('device.signal.received', (data: SignalPayload) => {
            setDevices(prev => {
                const existing = Object.values(prev).find(d => d.id === data.device_id);
                if (!existing) return prev;
                return {
                    ...prev,
                    [data.device_id]: {
                        ...existing,
                        last_lat:        data.lat,
                        last_lon:        data.lng,          // lng → last_lon
                        battery_percent: data.battery ?? existing.battery_percent,
                        status:          data.is_online ? 'active' : 'offline',
                        last_signal_at:  data.last_seen_at,
                    },
                };
            });
            flash(data.device_id, `Signal from #${data.device_id}`);
        });

        return () => {
            devicesChannel.unbind_all();
            logsChannel.unbind_all();
            pusher.unsubscribe(`private-user.${userId}.devices`);
            pusher.unsubscribe(`private-user.${userId}.device-logs`);
            pusher.disconnect();
        };
    }, [userId]);

    const list = Object.values(devices);

    return (
        <div className="space-y-4">
            {/* Connection status */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm flex-wrap"
                style={{
                    background: connected ? 'rgba(6,78,59,0.15)' : 'rgba(30,30,30,0.1)',
                    border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(100,100,100,0.25)'}`,
                }}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                <span style={{ color: connected ? '#6ee7b7' : '#9ca3af' }}>
                    {connected ? 'Live — connected to Soketi' : 'Connecting…'}
                </span>
                {lastEvent && (
                    <span className="text-xs" style={{ color: '#6b7280' }}>{lastEvent}</span>
                )}
                <span className="ml-auto text-xs font-mono hidden sm:block" style={{ color: '#4b5563' }}>
                    ws.track-any-device.com · {`user.${userId}.devices`} + device-logs
                </span>
            </div>

            {/* Device table */}
            {list.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-3xl mb-2">📡</p>
                    <p className="text-sm text-gray-400">No devices yet.</p>
                    <p className="text-xs text-gray-500 mt-1">Devices transmitting data will appear and update in real time.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Device</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Last Signal</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Location</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Battery</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {list.map(d => (
                                <tr key={d.id}
                                    className="transition-colors duration-500"
                                    style={{ background: updatedId === d.id ? 'rgba(16,185,129,0.07)' : undefined }}>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-gray-900 dark:text-white">{d.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{d.imei}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[d.status] ?? 'bg-gray-400'} ${d.status === 'active' ? 'animate-pulse' : ''}`} />
                                            <span className="text-xs capitalize text-gray-600 dark:text-gray-400">{d.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-gray-500">
                                        {d.last_signal_at ? new Date(d.last_signal_at).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell text-xs font-mono text-gray-500">
                                        {d.last_lat != null && d.last_lon != null
                                            ? `${d.last_lat.toFixed(5)}, ${d.last_lon.toFixed(5)}`
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs">
                                        {d.battery_percent != null ? (
                                            <span className={d.battery_percent < 20 ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                                {d.battery_percent}%
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
