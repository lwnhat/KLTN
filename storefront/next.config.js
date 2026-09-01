/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bắt buộc cho Docker deployment — tạo thư mục .next/standalone
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.vietqr.io' },
    ],
  },

  async rewrites() {
    const rawApiUrl = (process.env.INTERNAL_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
    const internalApiUrl = rawApiUrl.endsWith('/api/v1') ? rawApiUrl.slice(0, -7) : rawApiUrl;

    return [
      // Backend REST API
      {
        source: '/api/v1/:path*',
        destination: `${internalApiUrl}/api/v1/:path*`,
      },
    ];
  },
};



module.exports = nextConfig;

