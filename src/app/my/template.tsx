'use client';

import type { ReactNode } from 'react';
import { PortalTransition } from '@/components/tad/portal-transition';

/* Re-mounts on every in-segment navigation (App Router `template.tsx` semantics) while the /my
   chrome (MyShell → MyPortalShell header/footer) stays mounted. PortalTransition holds the
   hero-satellite loader for a minimum duration, then crossfades to the page content. */

export default function MyTemplate({ children }: { children: ReactNode }) {
  return <PortalTransition>{children}</PortalTransition>;
}
