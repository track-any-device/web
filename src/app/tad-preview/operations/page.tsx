import React from 'react';
import { SiteShell } from '@/components/tad/site-shell';
import { Section } from '@/components/tad/marketing';
import { OperationsClient } from './operations-client';

/* Internal operations portals (PREVIEW at /tad-preview/operations).
   Procurement / Workshop / Delivery-Order — role-gated in production. Placeholder data. */

export default function OperationsPreview() {
  return (
    <SiteShell>
      <Section eyebrow="Operations" title="Internal portals">
        <OperationsClient />
      </Section>
    </SiteShell>
  );
}
