import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isLocalhost = process.env.NODE_ENV === 'development';
  const baseUrl = isLocalhost 
    ? 'http://localhost:3000' 
    : 'https://marketplace-production-2905.up.railway.app'; // Your production frontend URL

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/agent-dashboard/',
          '/messages/',
          '/profile/',
        ],
      },
      // Explicitly allow AI bots to crawl properties and content
      {
        userAgent: 'OAI-SearchBot', // ChatGPT Search
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT Plugins/Browsing
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai', // Claude
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot', // Perplexity
        allow: '/',
      },
      {
        userAgent: 'Google-Extended', // Google Gemini
        allow: '/',
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
