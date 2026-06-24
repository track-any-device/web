'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { PortalLoader } from './portal-loader';

/* ─────────────────────────────────────────────────────────────────────────────
   LoadingProvider — the SINGLE source of truth for the portal satellite loader.

   The portals used to stack THREE loaders on one navigation: the route-segment
   `loading.tsx` satellite, then the `template.tsx`/PortalTransition satellite
   (min 1s), then each /my page's own bare "Loading…" text while it fetched data
   client-side. This provider replaces all of that with ONE continuous satellite
   that stays from page-load THROUGH api-load, then reveals the content once.

   How the single satellite is guaranteed:
   • This provider mounts inside each portal's CONTENT area (the layout's <main>),
     which PERSISTS across navigations. It renders {children} plus ONE absolutely-
     positioned <PortalLoader> overlay scoped to that content area — the header /
     footer / sidebar stay visible behind/around it.
   • `loading.tsx` (the server Suspense fallback) renders nothing now, and the
     PortalTransition satellite is gone — so the only satellite anywhere is this
     overlay. No stacking, no sequential blink-out/blink-in.
   • Visibility = (pending > 0) OR (still inside the post-navigation min window).
     `useTrackLoading(active)` lets any page push the "I'm still fetching" signal
     onto `pending`. On every `usePathname()` change (and the first mount) we open
     a min-MIN_LOADER_MS window. The overlay hides only once the min time has
     elapsed AND pending === 0 — so it can never flash for a sub-second hop, and it
     never disappears before the page's own data is ready.
   • prefers-reduced-motion → the fade is instant (the min window is still kept, so
     no sub-second flash).
   ──────────────────────────────────────────────────────────────────────────── */

export const MIN_LOADER_MS = 1000;

interface LoadingContextValue {
  /** Increment the pending counter; returns a function that decrements it once. */
  begin: () => () => void;
}

const LoadingContext = React.createContext<LoadingContextValue | null>(null);

/**
 * Mark the calling component as loading while `active` is true. The hook runs
 * unconditionally (call it at the top of the component, before any early return)
 * and increments the provider's pending counter while active, decrementing on
 * change/unmount. While pending > 0 the provider keeps the satellite overlay up.
 */
export function useTrackLoading(active: boolean): void {
  const ctx = React.useContext(LoadingContext);
  React.useEffect(() => {
    if (!active || !ctx) return;
    const end = ctx.begin();
    return end;
  }, [active, ctx]);
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  // How many components currently say "I'm still fetching".
  const [pending, setPending] = React.useState(0);
  // Whether we're still inside the post-navigation minimum-visibility window.
  const [minActive, setMinActive] = React.useState(true);

  const begin = React.useCallback(() => {
    setPending((n) => n + 1);
    let done = false;
    return () => {
      if (done) return;
      done = true;
      setPending((n) => Math.max(0, n - 1));
    };
  }, []);

  const ctxValue = React.useMemo<LoadingContextValue>(() => ({ begin }), [begin]);

  // On first mount AND every pathname change: open the min-visibility window.
  // A navigation always re-shows the satellite for at least MIN_LOADER_MS.
  React.useEffect(() => {
    setMinActive(true);
    const t = setTimeout(() => setMinActive(false), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  // Shown while anything is pending OR we're inside the min window. Because the
  // min window is re-armed on every navigation, "show until max(min, api-ready)"
  // reduces to this single boolean — one continuous satellite, page → API.
  const showLoader = pending > 0 || minActive;

  const fade = reduced ? 0 : 0.28;

  return (
    <LoadingContext.Provider value={ctxValue}>
      {children}
      <AnimatePresence initial={false}>
        {showLoader && (
          <motion.div
            key="portal-loader"
            aria-hidden={false}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: fade, ease: 'easeOut' }}
            style={{
              // Content-scoped: fill ONLY the positioned content parent (<main>),
              // so the header / footer / sidebar stay visible around it. Covers
              // full-bleed map pages too without clipping (inset:0 + the parent's
              // own size). Backdrop matches the app background so nothing peeks.
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg)',
            }}
          >
            <PortalLoader />
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}
