import {
  getAbsolutePublicUrl,
  getPublicSiteUrl,
  publicSeoKeywords,
  siteConfig,
} from '@/lib/public-seo';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | Intelligence assessment infrastructure`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: publicSeoKeywords,
  authors: [
    {
      name: 'IQMeridian',
      url: getAbsolutePublicUrl('/'),
    },
  ],
  creator: 'IQMeridian',
  publisher: 'IQMeridian',
  alternates: {
    canonical: getAbsolutePublicUrl('/'),
  },
  openGraph: {
    title: `${siteConfig.name} | Intelligence assessment infrastructure`,
    description: siteConfig.description,
    url: getAbsolutePublicUrl('/'),
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImagePath,
        width: 1200,
        height: 630,
        alt: 'IQMeridian intelligence assessment infrastructure',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} | Intelligence assessment infrastructure`,
    description: siteConfig.description,
    images: [siteConfig.twitterImagePath],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#020817',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
