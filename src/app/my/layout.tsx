import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession, type Session } from '@/lib/auth';
import MyShell from './my-shell';

export const runtime = 'edge';

export default async function MyLayout({ children }: { children: ReactNode }) {
    const hdrs = await headers();
    const raw = hdrs.get('x-tad-session');
    const session: Session | null = raw ? JSON.parse(raw) : await getSession();
    if (!session) redirect('/api/auth/login');

    const user = session?.user as {
        name?: string;
        email?: string;
        sub?: string;
        role?: string | string[];
    } | undefined;

    return (
        <MyShell user={user ?? null}>
            {children}
        </MyShell>
    );
}
