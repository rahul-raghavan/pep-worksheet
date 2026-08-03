import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  outputFileTracingIncludes: {
    '/api/worksheet/preview': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/worksheet/generate': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
