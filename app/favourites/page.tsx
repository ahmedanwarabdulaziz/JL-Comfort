import type { Metadata } from 'next';
import FavouritesClient from './FavouritesClient';

export const metadata: Metadata = {
  title: 'Your Favourite Fabrics',
  alternates: { canonical: '/favourites' },
  robots: { index: false, follow: true }, // each shopper's own list
};

export default function FavouritesPage() {
  return <FavouritesClient />;
}
