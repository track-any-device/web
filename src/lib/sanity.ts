/* Minimal, dependency-free Sanity read client (public dataset → no token in the browser).
   Writes/schema deploys happen server-side via the Sanity MCP or CLI with an Editor token —
   never with a public/blueprints token, and never from the client. */

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7sxkke45';
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01';

export const sanityConfig = { projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION } as const;

// Server-only read token (NOT NEXT_PUBLIC — never shipped to the browser). Reads happen in
// server components / route handlers, so the token stays server-side. Optional: if the dataset
// is made truly public, this can be unset.
const READ_TOKEN = process.env.SANITY_READ_TOKEN;

/** Run a GROQ query (server-side). Cached via apicdn + Next revalidate. */
export async function sanityFetch<T>(query: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}`);
  url.searchParams.set('query', query);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v));

  const headers: Record<string, string> = {};
  if (READ_TOKEN) headers.Authorization = `Bearer ${READ_TOKEN}`;

  const res = await fetch(url.toString(), { headers, next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Sanity query failed (${res.status}) for: ${query.slice(0, 80)}`);
  const json = (await res.json()) as { result: T };
  return json.result;
}

/* Example (wire once the DeviceType schema + content exist):
   export const PRODUCTS_QUERY = `*[_type == "deviceType" && active == true]{
     name, "slug": slug.current, category, vendor, protocol, pricePkr, "image": image.asset->url
   }`;
*/
