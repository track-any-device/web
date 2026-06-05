import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE  = 'tad_session'
const REDIRECT_COOKIE = 'tad_redirect'

export function middleware(req: NextRequest) {
    if (req.cookies.get(SESSION_COOKIE)) return NextResponse.next()

    const res = NextResponse.redirect(new URL('/api/auth/login', req.url))
    res.cookies.set(REDIRECT_COOKIE, req.nextUrl.pathname, {
        httpOnly: true,
        secure:   true,
        sameSite: 'lax',
        maxAge:   300,
        path:     '/',
    })
    return res
}

export const config = {
    matcher: ['/my/:path*'],
}
