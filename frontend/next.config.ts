import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for optimized Vercel deployment
  output: 'standalone',

  // Configure allowed image domains for external avatars
  images: {
    domains: [
      'lh3.googleusercontent.com',   // Google avatars
      'avatars.githubusercontent.com', // GitHub avatars
      'res.cloudinary.com',           // Cloudinary (if used)
    ],
  },

  // Optional: Enable React strict mode for development
  reactStrictMode: true,

  // Optional: Disable x-powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;