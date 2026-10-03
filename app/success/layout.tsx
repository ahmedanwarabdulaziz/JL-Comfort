import type { Metadata } from 'next';

// The order confirmation page is private to each shopper and shouldn't appear in search results.
export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
