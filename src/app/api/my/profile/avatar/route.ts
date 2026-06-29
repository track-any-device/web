import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

/** BFF: forward the profile-image multipart upload to the app API with the session bearer token.
 *  The body stays multipart form-data — do NOT JSON-encode it (the boundary header is preserved). */
export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });

    const form = await req.formData();

    const res = await fetch(`${API_URL}/api/my/profile/avatar`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.token}`,
            Accept: 'application/json',
        },
        body: form,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
}
