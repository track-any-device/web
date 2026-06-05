import { cookies } from 'next/headers'

const LOGIN_DOMAIN   = process.env.LOGIN_DOMAIN   ?? 'https://login.track-any-device.com'
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://track-any-device.com'

export const SSO_CLIENT_ID     = process.env.SSO_CLIENT_ID     ?? 'tad_web_portal'
export const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET ?? 'tad_web_portal_secret'
export const SSO_REDIRECT_URI  = `${APP_URL}/sso/callback`
export const SSO_AUTH_URL      = `${LOGIN_DOMAIN}/oauth/authorize`
export const SSO_TOKEN_URL     = `${LOGIN_DOMAIN}/oauth/token`
export const SSO_USERINFO_URL  = `${LOGIN_DOMAIN}/api/sso/user`

export const SESSION_COOKIE = 'tad_session'
export const STATE_COOKIE   = 'tad_oauth_state'

export function buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id:     SSO_CLIENT_ID,
        redirect_uri:  SSO_REDIRECT_URI,
        scope:         'openid profile email role fleet:read fleet:write',
        state,
    })
    return `${SSO_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(
    code: string,
): Promise<{ access_token: string; expires_in?: number } | null> {
    try {
        const res = await fetch(SSO_TOKEN_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:    'authorization_code',
                code,
                redirect_uri:  SSO_REDIRECT_URI,
                client_id:     SSO_CLIENT_ID,
                client_secret: SSO_CLIENT_SECRET,
            }),
        })
        if (!res.ok) return null
        return res.json()
    } catch {
        return null
    }
}

export async function getUserInfo(
    accessToken: string,
): Promise<Record<string, unknown> | null> {
    try {
        const res = await fetch(SSO_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return null
        return res.json()
    } catch {
        return null
    }
}

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

export function encodeSession(data: {
    token: string
    user?: Record<string, unknown>
}): string {
    const bytes = new TextEncoder().encode(JSON.stringify(data))
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
