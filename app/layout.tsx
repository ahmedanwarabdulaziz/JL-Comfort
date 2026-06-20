import { Providers } from './providers';
import './globals.css';
import ServiceWorkerCleanup from './service-worker-cleanup';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body>
        <ServiceWorkerCleanup />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
