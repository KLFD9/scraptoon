/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['uploads.mangadex.org'],
  },
  async rewrites() {
    return [
      {
        source: '/api/mangadex/:path*',
        destination: 'https://api.mangadex.org/:path*',
      },
    ];
  },
}

module.exports = nextConfig 