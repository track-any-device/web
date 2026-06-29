'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeDevices } from '@/hooks/use-realtime-devices';
import { ApiClient } from '@/lib/api-client';
import type { Device } from '@/lib/api-client';

/**
 * The single source of truth for the customer's device list + the live socket.
 *
 * Lives in the persistent `/my` shell (my-shell.tsx), so it mounts ONCE and survives
 * client-side (Link) navigation between `/my/*` pages. The device list is fetched a
 * single time on mount and the Soketi subscription stays open the whole time the user
 * is inside the portal — leaving `/my/devices` and coming back no longer re-fetches or
 * re-subscribes.
 */
interface RealtimeDevicesContextValue {
    /** Live-merged device list (initial fetch + real-time updates). */
    deviceList: Device[];
    /** Socket connection state (drives the 'Live' badge). */
    connected: boolean;
    /** Human-readable description of the most recent real-time event. */
    lastEvent: string | null;
    /** True while the one-time device-list fetch is in flight. */
    devicesLoading: boolean;
    /** Re-fetch the device list (e.g. after registering a new device). */
    reseedDevices: () => void;
}

const RealtimeDevicesContext = createContext<RealtimeDevicesContextValue | null>(null);

export function RealtimeDevicesProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth();
    const userId = String(user?.id ?? user?.sub ?? '0');

    const [initialDevices, setInitialDevices] = useState<Device[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);

    // Fetch the device list ONCE on mount (and again only when the token changes
    // or reseedDevices() is called). This is the single fetch for the whole portal.
    const loadDevices = useCallback(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.devices()
            .then(res => setInitialDevices(res.data))
            .catch(() => {})
            .finally(() => setDevicesLoading(false));
    }, [token]);

    useEffect(() => {
        if (!token) {
            // No token yet — don't fetch; surface empty/disconnected defaults below.
            setDevicesLoading(false);
            return;
        }
        setDevicesLoading(true);
        loadDevices();
    }, [token, loadDevices]);

    // One subscription for the whole portal. useRealtimeDevices no-ops without a token.
    const { deviceList, connected, lastEvent } = useRealtimeDevices(initialDevices, token, userId);

    const value: RealtimeDevicesContextValue = {
        deviceList,
        connected,
        lastEvent,
        devicesLoading,
        reseedDevices: loadDevices,
    };

    return (
        <RealtimeDevicesContext.Provider value={value}>
            {children}
        </RealtimeDevicesContext.Provider>
    );
}

/**
 * Read the shared device list + socket state. Safe to call outside the provider
 * (returns empty/disconnected defaults) so consumers never crash.
 */
export function useRealtimeDevicesContext(): RealtimeDevicesContextValue {
    const ctx = useContext(RealtimeDevicesContext);
    if (!ctx) {
        return {
            deviceList: [],
            connected: false,
            lastEvent: null,
            devicesLoading: false,
            reseedDevices: () => {},
        };
    }
    return ctx;
}
