import { MetadataRoute } from 'next';

const BASE_URL = 'https://kltn-ashy.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/products',
    '/products?category=nhan',
    '/products?category=vong-tay',
    '/products?category=day-chuyen',
    '/products?category=bong-tai',
    '/warranty',
    '/guide/size',
    '/guide/engraving',
    '/faq',
    '/terms',
    '/privacy',
    '/shipping',
    '/stores',
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/products' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/products') ? 0.9 : 0.7,
  }));
}
