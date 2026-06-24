import { PortalLoader } from '@/components/tad/portal-loader';

/* Route-segment Suspense fallback — shown ONLY while the server resolves a navigation (slow nav /
   hard refresh), inside the persistent /my chrome. It renders the identical <PortalLoader> as the
   client `template.tsx` (PortalTransition), so when the template mounts the satellite continues
   seamlessly — no double-loader. The MINIMUM 1s visibility is owned by PortalTransition, not here.*/

export default function Loading() {
  return <PortalLoader />;
}
