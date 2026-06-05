import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_URL = process.env.API_URL ?? 'https://api.track-any-device.com';

export async function POST(req: NextRequest) {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.text();

    const res = await fetch(`${API_URL}/api/my/broadcasting/auth`, {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Type':  'application/x-www-form-urlencoded',
            'Accept':        'application/json',
        },
        body,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
