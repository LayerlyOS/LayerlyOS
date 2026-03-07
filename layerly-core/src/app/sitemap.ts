import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://layerly.cloud';
  // List of static routes
  const routes = ['', '/login', '/reset-password'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each route
  routes.forEach((route) => {
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: route === '' ? 1 : 0.8,
    });
  });

  // Example: How to fetch dynamic data
  // const posts = await getPosts();
  // posts.forEach((post) => {
  //   sitemapEntries.push({
  //     url: `${baseUrl}/blog/${post.slug}`,
  //     lastModified: new Date(post.updatedAt),
  //     changeFrequency: 'weekly',
  //     priority: 0.7,
  //   });
  // });

  return sitemapEntries;
}
