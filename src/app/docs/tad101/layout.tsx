import type { Metadata } from 'next';
import { Tad101Layout } from '@/components/docs/tad101-layout';

export const metadata: Metadata = {
    title: { template: '%s – TAD101 | Track Any Device', default: 'TAD101 Docs | Track Any Device' },
    description: 'TAD101 universal protocol documentation — integrate any device with the Track Any Device platform.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <Tad101Layout>{children}</Tad101Layout>;
}
