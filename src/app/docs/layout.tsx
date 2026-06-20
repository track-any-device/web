import { SiteShell } from '@/components/tad/site-shell';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
