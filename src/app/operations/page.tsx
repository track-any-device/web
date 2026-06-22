import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { accessiblePortals } from '@/lib/portal-data';

export default async function OperationsIndex() {
  const role = String((await getSession())?.user?.role ?? '');
  const mine = accessiblePortals(role);
  redirect(mine.length ? `/operations/${mine[0]}` : '/my');
}
