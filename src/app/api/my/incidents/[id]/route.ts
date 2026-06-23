import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

/** BFF: full incident detail (attributes + locations trail + lifecycle timeline + past occurrences). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });

    const { id } = await params;
    const res = await fetch(`${API_URL}/api/my/incidents/${id}`, {
        headers: {
            Authorization: `Bearer ${session.token}`,
            Accept: 'application/json',
        },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
