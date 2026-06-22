import { NextRequest, NextResponse } from 'next/server'

// Cookie name is duplicated from lib/auth (middleware can't import next/headers).
const SESSION_COOKIE = 'tad_session'

export function middleware(req: NextRequest) {
    if (!req.cookies.has(SESSION_COOKIE)) {
        const url = new URL('/login', req.url)
        url.searchParams.set('next', req.nextUrl.pathname)
        return NextResponse.redirect(url)
    }
    return NextResponse.next()
}

// /my = customer portal; /operations + /admin = internal staff portals. All require a session;
// fine-grained role gating (Admin/Core/operations roles) happens server-side once wired to the API.
export const config = {
    matcher: ['/my/:path*', '/operations/:path*', '/admin/:path*'],
}
