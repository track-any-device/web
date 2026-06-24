/* Route-segment Suspense fallback for /operations. Renders NOTHING on purpose: the
   single continuous satellite loader is owned by <LoadingProvider> (mounted in the
   /operations content <main>, which persists across the loading.tsx↔page swap). The
   provider's overlay already covers the content pane during this server gap AND
   through any client-side data fetch, so rendering a satellite here too would stack
   a second one. Returning null keeps the provider as the SINGLE source of truth. */

export default function Loading() {
  return null;
}
