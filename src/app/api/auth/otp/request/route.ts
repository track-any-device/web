import { NextRequest, NextResponse } from 'next/server'
import { AUTH_API } from '@/lib/auth'

export const runtime = 'edge'

/** BFF: proxy SMS-OTP request to app (hides the API host from the browser). */
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(`${AUTH_API}/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phone: body.phone }),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
}
