import { ApolloClient, InMemoryCache, HttpLink, type ApolloClientOptions } from '@apollo/client';

const graphqlUrl = process.env.GRAPHQL_URL ?? 'http://app-graphql/graphql';

/**
 * Machine-to-machine headers for server component requests.
 * On the browser these are omitted — Sanctum session cookies are used instead.
 */
function serverHeaders(): Record<string, string> {
  const key    = process.env.GRAPHQL_KEY;
  const secret = process.env.GRAPHQL_SECRET;

  if (!key || !secret) return {};

  return {
    Authorization: `Bearer ${key}`,
    'X-Api-Secret': secret,
  };
}

/**
 * Create a fresh Apollo Client for use in React Server Components.
 * Each request gets its own client to avoid cross-request state sharing.
 */
export function makeServerClient(): ApolloClient<unknown> {
  return new ApolloClient({
    ssrMode: true,
    link: new HttpLink({
      uri: graphqlUrl,
      headers: serverHeaders(),
      fetch,
    }),
    cache: new InMemoryCache(),
  } as ApolloClientOptions<unknown>);
}

/**
 * Singleton browser Apollo Client (no API key — uses Sanctum cookies).
 * Import and use this in Client Components via useQuery / useSuspenseQuery.
 */
let browserClient: ApolloClient<unknown> | undefined;

export function getBrowserClient(): ApolloClient<unknown> {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient() must only be called in browser context');
  }

  if (!browserClient) {
    browserClient = new ApolloClient({
      link: new HttpLink({ uri: graphqlUrl, credentials: 'include' }),
      cache: new InMemoryCache(),
    } as ApolloClientOptions<unknown>);
  }

  return browserClient;
}
