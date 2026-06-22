import { SiteShell } from '@/components/tad/site-shell';
import { Hero } from '@/components/tad/marketing';

export default function Page() {
  return (
    <SiteShell>
      <Hero
        eyebrow="Buy in person"
        title="Find a TAD-PAK store"
        subtitle="Pick up a tracker and get it fitted at a partner store near you. Store locator coming soon — for now, order online with cash on delivery."
        primaryCta={{ label: 'Shop online', href: '/shop' }}
      />
    </SiteShell>
  );
}
