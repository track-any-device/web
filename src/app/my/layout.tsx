import type { ReactNode } from 'react';
import MyShell from './my-shell';

export const runtime = 'edge';

export default function MyLayout({ children }: { children: ReactNode }) {
    return <MyShell>{children}</MyShell>;
}
