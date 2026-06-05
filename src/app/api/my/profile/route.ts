import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_URL = process.env.API_URL ?? 'https://api.track-any-device.com';

function getToken(req: NextRequest): string | null {
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

export async function GET(req: NextRequest) {
    const token = getToken(req);
    if (!token) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const res = await fetch(`${API_URL}/api/my/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept':        'application/json',
        },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
    const token = getToken(req);
    if (!token) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const res = await fetch(`${API_URL}/api/my/profile`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
