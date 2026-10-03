import type { Metadata } from 'next';

// The sample request form is a per-shopper list, not a page worth showing in search results.
export const metadata: Metadata = {
  title: 'Request Free Samples',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
