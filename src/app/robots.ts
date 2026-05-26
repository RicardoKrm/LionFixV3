import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lionfix-erp.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/portal/', '/api/'], // Evitar que Google indexe los paneles privados
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
