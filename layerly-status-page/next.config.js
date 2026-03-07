/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  env: {
    // Automatically enable the built-in scheduler in development.
    // In production on Vercel, Vercel Cron handles this instead.
    ENABLE_BUILT_IN_CRON: process.env.NODE_ENV === 'development' ? 'true' : (process.env.ENABLE_BUILT_IN_CRON ?? 'false'),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001',
  },
};

module.exports = nextConfig;
