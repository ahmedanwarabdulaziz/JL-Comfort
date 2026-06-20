import { FabricItem } from '../types/fabric';

/**
 * JL Comfort in-house curated fabric collection.
 * These are our proprietary fabrics available for order directly.
 * swatchColor is used when no imageUrl is provided (CSS gradient/color).
 */
export const JL_COMFORT_FABRICS: FabricItem[] = [
  {
    id: 'jlc-001',
    name: 'Pearl Ivory Velvet',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #F5F0E8 0%, #DDD8CC 40%, #F5F0E8 70%, #EAE4D8 100%)',
    color: ['ivory', 'cream', 'neutral'],
    style: ['Modern', 'Traditional', 'Coastal', 'Glam'],
    fabricType: 'Velvet',
    source: 'jl-comfort',
    price: '$28/yard',
    description:
      'Premium heavyweight velvet with a soft, luminous sheen. Buttery to the touch and exceptionally durable for everyday use.',
    tags: ['velvet', 'luxury', 'neutral', 'ivory', 'upholstery', 'soft'],
  },
  {
    id: 'jlc-002',
    name: 'Midnight Navy Performance',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #1B2A4A 0%, #0D1B35 50%, #1B2A4A 100%)',
    color: ['navy', 'blue', 'dark', 'cool'],
    style: ['Modern', 'Industrial', 'Mid-Century Modern'],
    fabricType: 'Performance Fabric',
    source: 'jl-comfort',
    price: '$24/yard',
    description:
      'Stain-resistant, fade-proof performance fabric in deep midnight navy. Perfect for high-traffic family rooms and outdoor furniture.',
    tags: ['performance', 'stain-resistant', 'navy', 'durable', 'outdoor', 'family-friendly'],
  },
  {
    id: 'jlc-003',
    name: 'Terracotta Artisan Linen',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #C4602A 0%, #A8522A 50%, #CC6A34 100%)',
    color: ['terracotta', 'rust', 'orange', 'warm', 'earth'],
    style: ['Bohemian', 'Farmhouse', 'Mid-Century Modern', 'Coastal'],
    fabricType: 'Linen',
    source: 'jl-comfort',
    price: '$22/yard',
    description:
      'Hand-loomed linen blend in a rich terracotta tone. Natural texture adds warmth and an organic, artisanal feel to any piece.',
    tags: ['linen', 'natural', 'terracotta', 'earthy', 'boho', 'artisan'],
  },
  {
    id: 'jlc-004',
    name: 'Charcoal Stone Weave',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #36454F 0%, #2C3A42 50%, #404F58 100%)',
    color: ['charcoal', 'grey', 'dark', 'neutral'],
    style: ['Industrial', 'Modern', 'Mid-Century Modern'],
    fabricType: 'Textured',
    source: 'jl-comfort',
    price: '$26/yard',
    description:
      'Rich woven texture in deep charcoal with a subtle stone-like finish. Masculine and refined, ideal for statement armchairs and sofas.',
    tags: ['textured', 'charcoal', 'masculine', 'woven', 'durable'],
  },
  {
    id: 'jlc-005',
    name: 'Forest Green Plush Velvet',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #2D5A27 0%, #1E4020 50%, #336B2C 100%)',
    color: ['green', 'forest', 'dark', 'cool', 'earth', 'bold'],
    style: ['Glam', 'Bohemian', 'Traditional', 'Mid-Century Modern'],
    fabricType: 'Velvet',
    source: 'jl-comfort',
    price: '$30/yard',
    description:
      'Deep, lush forest green velvet with a plush pile that feels impossibly soft. A statement-making choice for accent chairs and headboards.',
    tags: ['velvet', 'green', 'bold', 'luxe', 'statement', 'rich'],
  },
  {
    id: 'jlc-006',
    name: 'Blush Rose Microfiber',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #E8A5B0 0%, #D9919E 50%, #EAB0BA 100%)',
    color: ['pink', 'blush', 'rose', 'pastel', 'warm'],
    style: ['Glam', 'Modern', 'Coastal', 'Traditional'],
    fabricType: 'Microfiber',
    source: 'jl-comfort',
    price: '$20/yard',
    description:
      'Ultra-soft microfiber in a delicate blush rose tone. Lightweight and breathable, with a suede-like hand feel.',
    tags: ['microfiber', 'blush', 'soft', 'feminine', 'pastel', 'light'],
  },
  {
    id: 'jlc-007',
    name: 'Caramel Faux Leather',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #C68642 0%, #A8712E 50%, #CC8E48 100%)',
    color: ['caramel', 'brown', 'tan', 'warm', 'earth'],
    style: ['Industrial', 'Mid-Century Modern', 'Farmhouse', 'Traditional'],
    fabricType: 'Leather',
    source: 'jl-comfort',
    price: '$35/yard',
    description:
      'Premium faux leather in warm caramel. Easy to clean, resistant to scratches, and develops a beautiful patina over time.',
    tags: ['faux-leather', 'caramel', 'durable', 'easy-clean', 'warm', 'classic'],
  },
  {
    id: 'jlc-008',
    name: 'Sage Mist Solid',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #8FAF8A 0%, #7A9975 50%, #9BB896 100%)',
    color: ['sage', 'green', 'muted', 'neutral', 'cool', 'earth'],
    style: ['Coastal', 'Farmhouse', 'Bohemian', 'Modern'],
    fabricType: 'Solid',
    source: 'jl-comfort',
    price: '$19/yard',
    description:
      'Calming sage green in a smooth, tightly-woven solid weave. Versatile and on-trend, pairs beautifully with natural wood and rattan.',
    tags: ['sage', 'green', 'calming', 'versatile', 'solid', 'neutral'],
  },
  {
    id: 'jlc-009',
    name: 'Sandy Beige Outdoor',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #D2B48C 0%, #C4A67E 50%, #DAC090 100%)',
    color: ['beige', 'sand', 'neutral', 'warm'],
    style: ['Coastal', 'Farmhouse', 'Traditional', 'Modern'],
    fabricType: 'Performance Fabric',
    source: 'jl-comfort',
    price: '$25/yard',
    description:
      'Weather-resistant outdoor performance fabric in sandy beige. UV-protected and mold-resistant for indoor-outdoor living.',
    tags: ['outdoor', 'weather-resistant', 'beige', 'UV-protected', 'performance', 'versatile'],
  },
  {
    id: 'jlc-010',
    name: 'Cobalt Bouclé Texture',
    imageUrl: '',
    swatchColor: 'linear-gradient(135deg, #2040A0 0%, #1830888 50%, #2848B8 100%)',
    color: ['blue', 'cobalt', 'bold', 'cool'],
    style: ['Modern', 'Glam', 'Mid-Century Modern'],
    fabricType: 'Textured',
    source: 'jl-comfort',
    price: '$32/yard',
    description:
      'Trendy bouclé texture in vibrant cobalt blue. The looped yarn construction adds incredible depth and a fashion-forward look.',
    tags: ['boucle', 'cobalt', 'trendy', 'textured', 'statement', 'modern'],
  },
];

/**
 * Get JL Comfort fabrics filtered by preferences.
 */
export function filterJLComfortFabrics(
  style: string,
  colors: string[],
  fabricType: string
): FabricItem[] {
  const colorLower = colors.map((c) => c.toLowerCase());
  const styleLower = style.toLowerCase();
  const typeLower = fabricType.toLowerCase();

  return JL_COMFORT_FABRICS.filter((fabric) => {
    // Style match (if specified)
    const styleMatch =
      !style ||
      fabric.style.some(
        (s) => s.toLowerCase() === styleLower || s.toLowerCase().includes(styleLower)
      );

    // Color match (if specified)
    const colorMatch =
      !colors.length ||
      colorLower.some((c) =>
        fabric.color.some((fc) => fc.toLowerCase().includes(c) || c.includes(fc.toLowerCase()))
      );

    // Fabric type match (if specified)
    const typeMatch =
      !fabricType ||
      fabric.fabricType.toLowerCase().includes(typeLower) ||
      typeLower.includes(fabric.fabricType.toLowerCase());

    return styleMatch && colorMatch && typeMatch;
  });
}
