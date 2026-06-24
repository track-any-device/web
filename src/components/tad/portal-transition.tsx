'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/* Content fade-in for portal navigations. The SATELLITE loader is owned entirely by
   <LoadingProvider> (mounted in each portal's content <main>), which shows ONE
   continuous satellite from page-load through api-load. This template no longer
   renders its own satellite — that would stack a second loader on top of the
   provider's. It now only does a subtle fade/rise of the page content as it appears,
   so the reveal stays gentle once the provider hides the satellite.

   App Router re-mounts a `template.tsx` on every in-segment navigation, so this
   animates fresh on each navigation. prefers-reduced-motion → no animation. */

export function PortalTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
