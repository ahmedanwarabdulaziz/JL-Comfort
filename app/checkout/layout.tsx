import type { Metadata } from 'next';

// Checkout pages are private to each shopper and shouldn't appear in search results.
export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
