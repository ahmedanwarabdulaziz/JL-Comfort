import type { Metadata } from 'next';
import { foamPageRobots } from '@/lib/site';
import FirmnessGuideClient from './FirmnessGuideClient';

export const metadata: Metadata = {
  title: 'Choosing Your Firmness',
  alternates: { canonical: '/firmness-guide' },
  robots: foamPageRobots,
  description: 'A guide to the four NeoGel compressions — Medium, Medium Firm, Firm, and XX-Firm — and which is right for your project.',
};

export default function FirmnessGuidePage() {
  return <FirmnessGuideClient />;
}
