import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = process.env.API_URL ?? 'https://api.track-any-device.com';

/**
 * Proxies Pusher private channel auth to the app/ My Portal broadcasting auth endpoint.
 *
 * Pusher JS calls POST /api/pusher/auth with:
 *   socket_id=...&channel_name=private-user.{userId}.*
 *
 * The My portal broadcasting endpoint at /api/my/broadcasting/auth accepts
 * Passport Bearer tokens and signs the channel auth response.
 *
 * Configured in StreamClient via: authEndpoint: '/api/pusher/auth'
 */
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.text();

    const res = await fetch(`${API_URL}/api/my/broadcasting/auth`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type':  'application/x-www-form-urlencoded',
            'Accept':        'application/json',
        },
        body,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
