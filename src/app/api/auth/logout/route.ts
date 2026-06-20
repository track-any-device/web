import { NextResponse } from 'next/server'
import { AUTH_API, SESSION_COOKIE, getSession } from '@/lib/auth'

export const runtime = 'edge'

/** BFF: revoke the token at app and clear the tad_session cookie. */
export async function POST() {
    const session = await getSession()
    if (session?.token) {
        await fetch(`${AUTH_API}/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
        }).catch(() => {})
    }
    const res = NextResponse.json({ status: 'logged_out' })
    res.cookies.delete(SESSION_COOKIE)
    return res
}
