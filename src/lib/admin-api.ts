import { getSession } from '@/lib/auth';

/* Server-side fetch for the internal portals (/admin, /operations). Uses the caller's Sanctum
   token (from the tad_session cookie) against app's role-gated /api/admin + /api/ops endpoints.

   Real data only — never seed/mock rows. On any miss the data is an empty array; `error` carries
   the actual reason in dev (so failures are visible) and is null in production (the UI shows a
   friendly empty state). */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com';
const DEV = process.env.NODE_ENV !== 'production';

/** Server pagination block returned by the paginated /api/admin + /api/ops lists. */
export interface PortalMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PortalResult<T> {
  data: T[];
  meta: PortalMeta | null;
  error: string | null;
}

export async function fetchPortal<T>(path: string): Promise<PortalResult<T>> {
  const session = await getSession();
  if (!session?.token) {
    return { data: [], meta: null, error: DEV ? 'Not signed in (no session token) — cannot load data.' : null };
  }
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { data: [], meta: null, error: DEV ? `API responded ${res.status} for ${path}.` : null };
    }
    const json = await res.json();
    // Bare-array endpoints and paginated {data, meta} endpoints both land here.
    if (Array.isArray(json)) {
      return { data: json as T[], meta: null, error: null };
    }
    if (json && Array.isArray(json.data)) {
      return { data: json.data as T[], meta: (json.meta ?? null) as PortalMeta | null, error: null };
    }
    return { data: [], meta: null, error: null };
  } catch (e) {
    return { data: [], meta: null, error: DEV ? `Request to ${path} failed: ${(e as Error).message}` : null };
  }
}

export interface PortalOne<T> {
  data: T | null;
  error: string | null;
}

/** Like fetchPortal, but for a single object endpoint. Returns null data on any miss. */
export async function fetchPortalOne<T>(path: string): Promise<PortalOne<T>> {
  const session = await getSession();
  if (!session?.token) {
    return { data: null, error: DEV ? 'Not signed in (no session token) — cannot load data.' : null };
  }
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.status === 404) return { data: null, error: 'Not found.' };
    if (!res.ok) return { data: null, error: DEV ? `API responded ${res.status} for ${path}.` : null };
    return { data: (await res.json()) as T, error: null };
  } catch (e) {
    return { data: null, error: DEV ? `Request to ${path} failed: ${(e as Error).message}` : null };
  }
}
