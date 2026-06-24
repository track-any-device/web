'use client';

import type { ReactNode } from 'react';
import { PortalTransition } from '@/components/tad/portal-transition';

/* Re-mounts on every in-segment navigation (App Router `template.tsx` semantics) while the /admin
   chrome (PortalSidebar + topbar) stays mounted. PortalTransition holds the hero-satellite loader
   for a minimum duration, then crossfades to the page content. */

export default function AdminTemplate({ children }: { children: ReactNode }) {
  return <PortalTransition>{children}</PortalTransition>;
}
