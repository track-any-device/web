import type { NextConfig } from 'next';

const config: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@trackany-device/components'],
  env: {
    GRAPHQL_URL:          process.env.GRAPHQL_URL          ?? 'https://graphql.track-any-device.com/graphql',
    NEXT_PUBLIC_APP_URL:  process.env.NEXT_PUBLIC_APP_URL  ?? 'https://track-any-device.com',
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
