import { SiteShell } from '@/components/tad/site-shell';
import { Hero } from '@/components/tad/marketing';

export default function Page() {
  return (
    <SiteShell>
      <Hero
        eyebrow="Pakistan-first GPS tracking"
        title="About TAD-PAK"
        subtitle="TAD-PAK keeps cars, bikes, and people safe across Pakistan with real-time GPS, SMS-OTP sign-in, and cash-on-delivery hardware."
        primaryCta={{ label: 'Shop trackers', href: '/shop' }}
      />
    </SiteShell>
  );
}
