import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = process.env.API_URL ?? 'https://api.track-any-device.com';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const res = await fetch(`${API_URL}/api/my/profile`, {
        headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept':        'application/json',
        },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const res = await fetch(`${API_URL}/api/my/profile`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
