import { NextRequest, NextResponse } from 'next/server'
import { AUTH_API, SESSION_COOKIE, encodeSession } from '@/lib/auth'

export const runtime = 'edge'

/** BFF: verify SMS-OTP with app, then store the Sanctum token in the httpOnly tad_session cookie. */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(`${AUTH_API}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: body.phone, otp: body.otp, device_name: 'web' }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    const response = NextResponse.json({ user: data.user })
    response.cookies.set(SESSION_COOKIE, encodeSession({ token: data.token, user: data.user }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
    })
    return response
}
