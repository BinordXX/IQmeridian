import {
  getAbsolutePublicUrl,
  publicSitemapRoutes,
} from '@/lib/public-seo';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicSitemapRoutes.map((route) => ({
    url: getAbsolutePublicUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}