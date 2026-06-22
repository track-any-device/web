import { SiteShell } from '@/components/tad/site-shell';
import { Hero } from '@/components/tad/marketing';

export default function Page() {
  return (
    <SiteShell>
      <Hero
        eyebrow="Built for fleets and teams"
        title="TAD-PAK for business"
        subtitle="Live tracking, geofences, and trip history for cars, bikes, and field staff — one dashboard for your whole fleet. Pilots starting soon."
        primaryCta={{ label: 'Talk to us', href: '/support' }}
      />
    </SiteShell>
  );
}
