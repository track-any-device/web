import type { ReactNode } from 'react';
import MyShell from './my-shell';
import { MyPortalShell } from '@/components/tad/my-portal-shell';

export const runtime = 'edge';

export default function MyLayout({ children }: { children: ReactNode }) {
    return (
        <MyShell>
            <MyPortalShell>{children}</MyPortalShell>
        </MyShell>
    );
}
