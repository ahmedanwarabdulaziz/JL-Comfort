import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/checkout', '/success', '/request-samples'],
      },
      // Crawlers that copy the site to train AI models and send no visitors back (Meta's alone made
      // ~3,000 requests in one afternoon, and
      // meta-webindexer over 100,000 in a week). AI *search* bots (OAI-SearchBot, ChatGPT-User,
      // PerplexityBot, Googlebot) stay allowed: they are how "AI assistant" customers find us.
      {
        userAgent: ['meta-externalagent', 'meta-webindexer', 'GPTBot', 'CCBot', 'Bytespider', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'cohere-ai', 'Diffbot', 'omgili', 'ImagesiftBot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
