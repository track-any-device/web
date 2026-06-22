import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { accessiblePortals, canAccessPortal } from '@/lib/portal-data';

/**
 * Server guard for an operations portal page. Redirects a role that can't access
 * this portal to its own first portal (or /my if it has none).
 */
export async function requirePortal(portal: string) {
  const session = await getSession();
  const role = String(session?.user?.role ?? '');
  if (!canAccessPortal(role, portal)) {
    const mine = accessiblePortals(role);
    redirect(mine.length ? `/operations/${mine[0]}` : '/my');
  }
  return { session, role };
}
