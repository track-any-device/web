/* Client-side admin mutations (browser → BFF route handlers under /api/admin).

   Kept separate from admin-api.ts because that module imports getSession (next/headers), which is
   server-only and cannot be bundled into a Client Component. These helpers run in the browser and
   hit the BFF, which attaches the session token server-side and proxies to app's REST API. */

export interface MutationResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Update a device's ownership — owner (user_id) and organisation (tenant_id). Pass null to clear a
 * field ("Unassigned"). Proxies through PATCH /api/admin/devices/{id}. Returns the updated
 * AdminDeviceDetail on success.
 */
export async function updateDeviceOwnership<T>(
  id: number | string,
  payload: { user_id?: number | null; tenant_id?: number | null },
): Promise<MutationResult<T>> {
  try {
    const res = await fetch(`/api/admin/devices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, data: null, error: (data as { message?: string })?.message ?? `Update failed (${res.status}).` };
    }
    return { ok: true, data: data as T, error: null };
  } catch (e) {
    return { ok: false, data: null, error: `Network error — ${(e as Error).message}` };
  }
}
