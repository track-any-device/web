import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

function getToken(req: NextRequest): string | null {
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

/** BFF: claim a tenant device into the caller's personal account (tenant → personal). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = getToken(req);
    if (!token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });

    const { id } = await params;
    const res = await fetch(`${API_URL}/api/my/devices/${id}/claim`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: '{}',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
