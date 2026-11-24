import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/account', '/cart', '/checkout', '/orders', '/login', '/reset-password', '/track-your-order'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
