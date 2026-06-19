import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Section } from '@/components/tad/marketing';
import { PortalClient } from './portal-client';

/* Customer portal "My things" shell (PREVIEW at /tad-preview/portal).
   Placeholder devices; wire to app REST via the Cloudflare BFF + Soketi realtime in Phase 5b. */

export default function PortalPreview() {
  return (
    <SiteShell>
      <Section eyebrow="My devices" title="My things">
        <PortalClient />
      </Section>
    </SiteShell>
  );
}
