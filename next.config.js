/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  compress: true,
  assetPrefix: '',
  basePath: '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
