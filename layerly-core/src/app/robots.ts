import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // In a real application, you might want to disallow private routes:
      // disallow: ['/admin', '/dashboard'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
