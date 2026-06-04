'use client';

import { useEffect } from 'react';

const SESSION_KEY = 'tad_token';

/**
 * Reads the tad_token cookie (set by the SSO callback) and copies the
 * access token into sessionStorage so client components can call the API
 * directly without going through server-side proxy routes.
 *
 * sessionStorage persists for the lifetime of the browser tab.
 * Falls back to the cookie if sessionStorage is unavailable.
 */
export default function TokenInit() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Already in sessionStorage — nothing to do
        if (sessionStorage.getItem(SESSION_KEY)) return;

        // Read from cookie and populate sessionStorage
        const match = document.cookie.match(/(?:^|;\s*)tad_token=([^;]+)/);
        if (match?.[1]) {
            sessionStorage.setItem(SESSION_KEY, decodeURIComponent(match[1]));
        }
    }, []);

    return null;
}

/** Returns the access token from sessionStorage (or cookie fallback). */
export function getClientToken(): string | null {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const match = document.cookie.match(/(?:^|;\s*)tad_token=([^;]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
}
