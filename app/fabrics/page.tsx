import type { Metadata } from 'next';
import FabricsShopClient from '@/components/fabrics/FabricsShopClient';

export const metadata: Metadata = {
  title: 'Shop Fabrics',
  description: 'Browse and order Charlotte Fabrics by the yard, with real per-SKU pricing and free samples.',
};

export default function FabricsPage() {
  return <FabricsShopClient />;
}
