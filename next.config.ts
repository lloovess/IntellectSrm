import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse"],
  transpilePackages: [
    '@react-pdf/renderer',
    '@react-pdf/layout',
    '@react-pdf/pdfkit',
    '@react-pdf/primitives',
  ],
};

export default nextConfig;
