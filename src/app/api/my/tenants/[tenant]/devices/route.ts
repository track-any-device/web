import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

function getToken(req: NextRequest): string | null {
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

/** BFF: devices belonging to one of the user's organisations (the user must be a member). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
    const token = getToken(req);
    if (!token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });

    const { tenant } = await params;
    const res = await fetch(`${API_URL}/api/my/tenants/${tenant}/devices`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
