import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import MyShell from './my-shell';

export const runtime = 'edge';

export default async function MyLayout({ children }: { children: ReactNode }) {
    const session = await getSession();
    if (!session) redirect('/api/auth/signin/sso');

    const user = session.user as {
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
