/* Route-segment Suspense fallback for /my. Renders NOTHING on purpose: the single
   continuous satellite loader is owned by <LoadingProvider> (mounted in the /my
   content <main>, which persists across the loading.tsx↔page swap). The provider's
   overlay already covers the content area during this server gap AND through the
   page's client-side API fetch, so rendering a satellite here too would stack a
   second one. Returning null keeps the provider as the SINGLE source of truth. */

export default function Loading() {
  return null;
}
