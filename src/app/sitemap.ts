import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Aquí debes poner el dominio real cuando lo compren, por ejemplo: 'https://www.lionfix.cl'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lionfix-erp.vercel.app';

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
