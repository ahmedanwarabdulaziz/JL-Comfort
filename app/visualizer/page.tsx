import { Metadata } from 'next';
import VisualizerClient from './VisualizerClient';

export const metadata: Metadata = {
  title: 'AI Furniture Visualizer | JL Comfort',
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
  return <VisualizerClient />;
}
