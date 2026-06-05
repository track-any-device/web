import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, decodeSessionValue } from '@/lib/auth'

const REDIRECT_COOKIE = 'tad_redirect'

export function middleware(req: NextRequest) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value

    if (raw) {
        const session = decodeSessionValue(raw)
        if (session) {
            const headers = new Headers(req.headers)
            headers.set('x-tad-session', JSON.stringify(session))
            return NextResponse.next({ request: { headers } })
        }
    }

    const res = NextResponse.redirect(new URL('/api/auth/login', req.url))
    res.cookies.set(REDIRECT_COOKIE, req.nextUrl.pathname, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   300,
        path:     '/',
    })
    return res
}

export const config = {
    matcher: ['/my/:path*'],
}
