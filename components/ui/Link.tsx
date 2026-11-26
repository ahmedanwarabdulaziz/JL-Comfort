'use client';

import NextLink from 'next/link';
import { forwardRef, type ComponentProps } from 'react';

// next/link with prefetching off. By default Next fetches every link that scrolls into view (menu,
// footer, 48 product cards), which was about 30% of all requests to the site -- each one counted by
// Vercel, and on uncached pages each ran a server function. The page is now fetched on click.
// Use this for storefront links; pass `prefetch` to turn it back on for a particular one.
const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link({ prefetch = false, ...props }, ref) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});

export default Link;
