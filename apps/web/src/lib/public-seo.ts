export const siteConfig = {
  name: 'IQMeridian',
  shortName: 'IQMeridian',
  description:
    'IQMeridian is intelligence assessment infrastructure for structured cognitive testing, psychometric scoring, validity diagnostics, research governance, and role-aware dashboards.',
  domain: 'iqmeridian.com',
  defaultUrl: 'https://iqmeridian.com',
  ogImagePath: '/opengraph-image',
  twitterImagePath: '/twitter-image',
};

export const publicSeoKeywords = [
  'IQMeridian',
  'intelligence assessment',
  'cognitive assessment',
  'IQ testing platform',
  'psychometric scoring',
  'assessment governance',
  'candidate assessment',
  'research governance',
  'validity diagnostics',
  'standard score',
  'percentile profile',
];

export const publicSitemapRoutes = [
  {
    path: '/',
    priority: 1,
    changeFrequency: 'weekly',
  },
  {
    path: '/about',
    priority: 0.85,
    changeFrequency: 'monthly',
  },
  {
    path: '/pricing',
    priority: 0.8,
    changeFrequency: 'monthly',
  },
  {
    path: '/research-governance',
    priority: 0.85,
    changeFrequency: 'monthly',
  },
  {
    path: '/resources',
    priority: 0.75,
    changeFrequency: 'weekly',
  },
  {
    path: '/api',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/security',
    priority: 0.75,
    changeFrequency: 'monthly',
  },
  {
    path: '/careers',
    priority: 0.55,
    changeFrequency: 'monthly',
  },
  {
    path: '/contact',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  {
    path: '/privacy',
    priority: 0.35,
    changeFrequency: 'yearly',
  },
  {
    path: '/terms',
    priority: 0.35,
    changeFrequency: 'yearly',
  },
] as const;

export function getPublicSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    siteConfig.defaultUrl;

  return configuredUrl.replace(/\/$/, '');
}

export function getAbsolutePublicUrl(path = '/') {
  const siteUrl = getPublicSiteUrl();
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;

  return `${siteUrl}${normalisedPath}`;
}