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
        ],
      },
    ];
  },
};

export default nextConfig;
