import { SiteShell } from '@/components/tad/site-shell';
import { Hero } from '@/components/tad/marketing';

export default function Page() {
  return (
    <SiteShell>
      <Hero
        eyebrow="Live service status"
        title="All systems operational"
        subtitle="Tracking, the app, and the website are running normally. We post any incidents or maintenance windows here."
        primaryCta={{ label: 'Back to home', href: '/' }}
      />
    </SiteShell>
  );
}
