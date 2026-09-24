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
  title: {
    default: 'JL Comfort | Custom Foam & Upholstery',
    template: '%s | JL Comfort',
  },
  description:
    'Custom-cut NeoGel High-Density foam for cushions and mattresses, plus AI-powered fabric visualization for reupholstery projects. Measure once, order online.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${workSans.className} ${workSans.variable} ${fraunces.variable}`}
    >
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ServiceWorkerCleanup />
        <ClarityInit />
        <Providers>
          <AnnouncementBar />
          <SiteHeader />
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
          <AIGuide />
        </Providers>
      </body>
    </html>
  );
}
