import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  output: 'standalone',
  // @track-any-device/components is consumed as raw TS source via file: dep.
  typescript: { ignoreBuildErrors: true },
  // Transpile the file: package so Next.js treats it as first-party code.
  // This ensures only one React instance is used (eliminating useContext=null).
  transpilePackages: ['@track-any-device/components'],
  env: {
    GRAPHQL_URL: process.env.GRAPHQL_URL ?? 'http://app-graphql/graphql',
  },
  webpack(webpackConfig) {
    // @track-any-device/components is a file: symlink to packages/node.
    // Its deps live in web/node_modules — add it to module search paths.
    webpackConfig.resolve.modules = [
      ...(webpackConfig.resolve.modules ?? []),
      path.resolve(__dirname, 'node_modules'),
    ];
    return webpackConfig;
  },
};

export default config;
