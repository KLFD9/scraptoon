import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Améliorer l'hydratation
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimisations pour éviter les problèmes d'hydratation
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  
  // Configuration pour l'environnement de développement
  eslint: {
    ignoreDuringBuilds: false
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Headers pour éviter les conflits d'extensions
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/mangadex/:path*',
        destination: 'https://api.mangadex.org/:path*',
      },
    ];
  },
};

export default nextConfig;
