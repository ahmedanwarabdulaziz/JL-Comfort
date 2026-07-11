import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import ServiceWorkerCleanup from './service-worker-cleanup';
import { Inter } from 'next/font/google';
import Footer from '@/components/layout/Footer';
import SiteHeader from '@/components/layout/SiteHeader';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
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
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ServiceWorkerCleanup />
        <Providers>
          <SiteHeader />
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
