import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VisualizerClient from './VisualizerClient';
import { AI_FEATURES_ENABLED } from '@/lib/features';

export const metadata: Metadata = {
  title: 'AI Furniture Visualizer',
  // Not launched yet: keep it out of search until it is.
  robots: { index: false, follow: false },
  description:
    'Upload a photo of your old furniture, choose your fabric preferences, and let AI show you what it will look like reupholstered. Powered by Google Gemini.',
  openGraph: {
    title: 'AI Furniture Visualizer | JL Comfort',
    description:
      'See your furniture reimagined with premium fabrics before you commit. AI-powered reupholstery visualization.',
    type: 'website',
  },
};

export default function VisualizerPage() {
  if (!AI_FEATURES_ENABLED) notFound();
  return <VisualizerClient />;
}
