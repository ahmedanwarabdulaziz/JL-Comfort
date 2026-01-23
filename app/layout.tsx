import { Providers } from './providers';
import './globals.css';
import ServiceWorkerCleanup from './service-worker-cleanup';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ServiceWorkerCleanup />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
