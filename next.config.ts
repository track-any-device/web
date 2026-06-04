import type { NextConfig } from 'next';

const config: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@trackany-device/components'],
  env: {
    GRAPHQL_URL:                  process.env.GRAPHQL_URL                  ?? 'https://graphql.track-any-device.com/graphql',
    NEXT_PUBLIC_APP_URL:          process.env.NEXT_PUBLIC_APP_URL          ?? 'https://track-any-device.com',
    API_URL:                      process.env.API_URL                      ?? 'https://api.track-any-device.com',
    // Pusher / Soketi — broadcasting (set these in Cloudflare Pages env or .env.local)
    PUSHER_APP_ID:                process.env.PUSHER_APP_ID                ?? '',
    PUSHER_APP_SECRET:            process.env.PUSHER_APP_SECRET            ?? '',
    NEXT_PUBLIC_PUSHER_APP_KEY:   process.env.NEXT_PUBLIC_PUSHER_APP_KEY   ?? '',
    NEXT_PUBLIC_PUSHER_HOST:      process.env.NEXT_PUBLIC_PUSHER_HOST      ?? 'ws.track-any-device.com',
    NEXT_PUBLIC_PUSHER_PORT:      process.env.NEXT_PUBLIC_PUSHER_PORT      ?? '443',
    NEXT_PUBLIC_PUSHER_SCHEME:    process.env.NEXT_PUBLIC_PUSHER_SCHEME    ?? 'https',
    NEXT_PUBLIC_PUSHER_CLUSTER:   process.env.NEXT_PUBLIC_PUSHER_CLUSTER   ?? 'mt1',
  },
  webpack(webpackConfig) {
    // pnpm resolves symlinks to a deep store path, which breaks transpilePackages
    // (it checks the path before symlink resolution). Disabling symlink resolution
    // keeps paths as node_modules/@trackany-device/components so the rule matches.
    webpackConfig.resolve.symlinks = false;
    return webpackConfig;
  },
};

export default config;
