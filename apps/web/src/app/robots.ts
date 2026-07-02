import { getAbsolutePublicUrl } from '@/lib/public-seo';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/pricing',
          '/research-governance',
          '/resources',
          '/api',
          '/security',
          '/careers',
          '/contact',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard/',
          '/internal/',
          '/assessment/',
          '/employer/',
          '/logout',
        ],
      },
    ],
    sitemap: getAbsolutePublicUrl('/sitemap.xml'),
    host: getAbsolutePublicUrl('/'),
  };
}