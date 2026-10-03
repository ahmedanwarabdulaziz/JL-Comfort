'use client';

import Image from 'next/image';
import type { CSSProperties, ReactEventHandler } from 'react';

// Hosts listed in next.config.js images.remotePatterns. Only these can go through the image
// optimiser; anything else falls back to a plain <img> instead of throwing at render time.
const OPTIMISABLE = [/^https:\/\/www\.charlottefabrics\.com\/wp-content\/uploads\//, /^https:\/\/pub-7e5f5ae157894c8c95bbc5f77e2929f0\.r2\.dev\//];

// A fabric photo that fills its (positioned, sized) parent. The supplier's photos are ~190 KB,
// 1,000 px JPEGs; through the optimiser a grid thumbnail becomes a ~15 KB WebP at the size shown,
// which is what keeps collection pages fast enough for Google's Core Web Vitals and ad landing pages.
export default function FabricImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  style,
  onError,
}: {
  src: string;
  alt: string;
  sizes: string; // how wide it renders, e.g. "(max-width: 900px) 50vw, 25vw"
  priority?: boolean; // true for the main image above the fold (the page's largest paint)
  className?: string;
  style?: CSSProperties;
  onError?: ReactEventHandler<HTMLImageElement>; // e.g. hide a broken supplier photo
}) {
  const fitStyle: CSSProperties = { objectFit: 'cover', ...style };
  if (!OPTIMISABLE.some((pattern) => pattern.test(src))) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        onError={onError}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...fitStyle }}
      />
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={70} className={className} style={fitStyle} onError={onError} />;
}
