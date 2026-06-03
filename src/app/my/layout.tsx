import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import MyShell from './my-shell';

// Cloudflare Pages requires Edge Runtime for all server-rendered routes
// that use cookies() / headers() (including getSession which calls cookies()).
export const runtime = 'edge';

export default async function MyLayout({ children }: { children: ReactNode }) {
    const session = await getSession();
    if (!session) redirect('/api/auth/login');

    const user = session.user as { name?: string; email?: string; sub?: string } | undefined;

    return (
        <MyShell user={user ?? null}>
            {children}
        </MyShell>
    );
}
