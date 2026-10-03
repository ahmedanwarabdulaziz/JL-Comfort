import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import ServiceWorkerCleanup from './service-worker-cleanup';
import { Work_Sans, Fraunces } from 'next/font/google';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import AIGuide from '@/components/ai/AIGuide';
import ClarityInit from '@/components/analytics/ClarityInit';
import AdTracking from '@/components/analytics/AdTracking';
import CookieConsent from '@/components/consent/CookieConsent';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { AI_FEATURES_ENABLED } from '@/lib/features';

// Body copy, buttons, and labels/eyebrows/nav (exposed as --font-label). Loaded as the variable
// font so every weight used (400 through 900) renders true, not a synthesized bold.
const workSans = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-label',
});

// Editorial display face for headlines — set via CSS var so Typography h1-h6
// can pick it up through the MUI theme (see lib/theme.ts).
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'JL Comfort | Custom Foam, Cushions & Upholstery Fabric in Canada',
    template: '%s | JL Comfort',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_CA',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  // Search Console / Meta domain verification -- paste the codes into the host's env when you get them.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: {
      ...(process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION
        ? { 'facebook-domain-verification': process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION }
        : {}),
      // Bing Webmaster Tools -- Bing also feeds ChatGPT search, Copilot and DuckDuckGo.
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : {}),
    },
  },
};

// Who the business is, for Google's knowledge panel and rich results. Add sameAs links
// (Instagram, Facebook) and contact details once they're final.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      areaServed: 'CA',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-CA',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-CA"
      suppressHydrationWarning
      className={`${workSans.className} ${workSans.variable} ${fraunces.variable}`}
    >
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ServiceWorkerCleanup />
        <ClarityInit />
        <AdTracking />
        <JsonLd data={organizationJsonLd} />
        <Providers>
          <AnnouncementBar />
          <SiteHeader />
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
          <CookieConsent />
          {AI_FEATURES_ENABLED && <AIGuide />}
        </Providers>
      </body>
    </html>
  );
}
