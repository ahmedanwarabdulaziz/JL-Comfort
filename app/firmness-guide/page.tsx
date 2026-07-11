import type { Metadata } from 'next';
import FirmnessGuideClient from './FirmnessGuideClient';

export const metadata: Metadata = {
  title: 'Choosing Your Firmness',
  description: 'A guide to the four NeoGel compressions — Medium, Medium Firm, Firm, and XX-Firm — and which is right for your project.',
};

export default function FirmnessGuidePage() {
  return <FirmnessGuideClient />;
}
