import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import type { Session } from '@/lib/auth';
import MyShell from './my-shell';

export default async function MyLayout({ children }: { children: ReactNode }) {
    const hdrs = await headers();
    const raw = hdrs.get('x-tad-session');
    const session: Session | null = raw ? JSON.parse(raw) : null;

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
