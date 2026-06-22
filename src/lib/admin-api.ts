import { getSession } from '@/lib/auth';

/* Server-side fetch for the internal portals (/admin, /operations). Uses the caller's Sanctum
   token (from the tad_session cookie) against app's role-gated /api/admin + /api/ops endpoints.
   Returns `fallback` on any miss (no session, 401/403, network) so pages render gracefully. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';

export async function fetchPortal<T>(path: string, fallback: T): Promise<T> {
  const session = await getSession();
  if (!session?.token) return fallback;
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
