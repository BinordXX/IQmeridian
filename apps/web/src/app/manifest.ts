import { getAbsolutePublicUrl, siteConfig } from '@/lib/public-seo';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} | Intelligence assessment infrastructure`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: getAbsolutePublicUrl('/'),
    display: 'standalone',
    background_color: '#020817',
    theme_color: '#020817',
    categories: ['education', 'productivity', 'business'],
    lang: 'en',
    orientation: 'portrait-primary',
    scope: getAbsolutePublicUrl('/'),
  };
}
