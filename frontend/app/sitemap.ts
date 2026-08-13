import { MetadataRoute } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://marketplace-production-2905.up.railway.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isLocalhost = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalhost 
    ? 'http://localhost:3000' 
    : 'https://marketplace-production-2905.up.railway.app'; // Your production frontend URL

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Fetch properties for dynamic routes
  try {
    const response = await fetch(`${API_BASE_URL}/properties?limit=1000`);
    if (response.ok) {
      const data = await response.json();
      const properties = data.items || data || [];
      
      const propertyRoutes = (properties as Array<Record<string, unknown>>).map((property) => ({
        url: `${baseUrl}/property/${property.id}`,
        lastModified: property.updated_at ? new Date(String(property.updated_at)) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));

      routes.push(...propertyRoutes);
    }
  } catch (error) {
    console.error('Failed to fetch properties for sitemap:', error);
  }

  return routes;
}
