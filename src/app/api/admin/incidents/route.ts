import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

/* BFF: incidents list for the admin view (Admin/Core), scoped to a day window.
   The browser refetches this when the day filter changes; the page does the initial
   server fetch. Real data only — on any miss we return [] so the UI shows an empty
   state rather than fabricated rows. */

const ALLOWED_DAYS = new Set([7, 30, 90]);

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.token) return NextResponse.json([], { status: 401 });

  const raw = Number(req.nextUrl.searchParams.get('days'));
  const days = ALLOWED_DAYS.has(raw) ? raw : 7;

  try {
    const res = await fetch(`${API_URL}/api/admin/incidents?days=${days}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const json = await res.json().catch(() => []);
    return NextResponse.json(Array.isArray(json) ? json : [], { status: 200 });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
