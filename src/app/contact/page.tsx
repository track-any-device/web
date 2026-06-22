import { SiteShell } from '@/components/tad/site-shell';
import { Hero } from '@/components/tad/marketing';

export default function Page() {
  return (
    <SiteShell>
      <Hero
        eyebrow="We are here to help"
        title="Contact TAD-PAK"
        subtitle="Questions about a device, an order, or your account? Reach our support team and we will get back to you quickly."
        primaryCta={{ label: 'Go to support', href: '/support' }}
      />
    </SiteShell>
  );
}
