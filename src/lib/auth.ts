import { cookies } from 'next/headers'

/* First-party auth against app's REST API (Sanctum tokens). The SSO redirect/OAuth flow is gone —
   the BFF route handlers under /api/auth/* call app and store the token in the tad_session cookie. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

export const AUTH_API = `${API_URL}/api/auth`
export const SESSION_COOKIE = 'tad_session'

export type Session = { token: string; user?: Record<string, unknown> }

export function decodeSessionValue(raw: string): Session | null {
    try {
        let v: string
        try { v = decodeURIComponent(raw) } catch { v = raw }
        v = v.replace(/-/g, '+').replace(/_/g, '/')
        const pad = v.length % 4
        if (pad === 2) v += '=='
        else if (pad === 3) v += '='
        return JSON.parse(
            new TextDecoder().decode(
                Uint8Array.from(atob(v), c => c.charCodeAt(0)),
            ),
        )
    } catch {
        return null
    }
}

export async function getSession(): Promise<Session | null> {
    const jar = await cookies()
    const raw = jar.get(SESSION_COOKIE)?.value
    if (!raw) return null
    return decodeSessionValue(raw)
}

export function encodeSession(data: { token: string; user?: Record<string, unknown> }): string {
    const bytes = new TextEncoder().encode(JSON.stringify(data))
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
