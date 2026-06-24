'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PortalLoader } from './portal-loader';

/* Content-scoped portal transition — enforces a MINIMUM satellite-loader duration and crossfades
   to the page, all INSIDE the portal layout so the sidebar/header/footer never re-mount or flash.

   ── How it works ──────────────────────────────────────────────────────────────────────────────
   This renders from each portal's `template.tsx`. App Router re-mounts a `template.tsx` on every
   in-segment navigation (unlike `layout.tsx`, which persists), so this component mounts fresh with
   the NEW page's `children` each time the user navigates — i.e. one mount == one navigation that
   has already resolved (the route-segment `loading.tsx` Suspense fallback covered any server-side
   data fetch before the template mounts).

   On mount we show <PortalLoader> (the same hero-satellite visual as loading.tsx) and keep it for
   `MIN_LOADER_MS`, then crossfade to the page content. Because the template only mounts once the
   navigation is ready, "show the loader until max(MIN_LOADER_MS, content-ready)" reduces to "show
   it for at least MIN_LOADER_MS" — guaranteeing the loader can never flash for a sub-second hop.

   ── Why there's no double-loader ──────────────────────────────────────────────────────────────
   `loading.tsx` and this template render the IDENTICAL <PortalLoader>. The handoff is:
     server work (slow nav / hard refresh)  →  loading.tsx shows the satellite
     navigation resolves, template mounts   →  this satellite takes over seamlessly (same pixels)
                                            →  holds to MIN_LOADER_MS, then crossfades to content
   The user sees one continuous satellite that fades into the page — never two loaders stacked or a
   loader that blinks out and back. For fast client navigations `loading.tsx` may not show at all;
   this template still guarantees the ≥1s satellite.

   ── prefers-reduced-motion ────────────────────────────────────────────────────────────────────
   The 1s minimum is still enforced (no sub-second flash), but the crossfade is skipped — the
   satellite shows and the content appears instantly when the timer elapses. */

export const MIN_LOADER_MS = 1000;

export function PortalTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  // Start showing the loader on every mount (== every navigation within the segment).
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  const fadeDuration = reduced ? 0 : 0.28;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {ready ? (
        <motion.div
          key="content"
          style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: fadeDuration, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="loader"
          style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}
          initial={false}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: fadeDuration, ease: 'easeOut' }}
        >
          <PortalLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
