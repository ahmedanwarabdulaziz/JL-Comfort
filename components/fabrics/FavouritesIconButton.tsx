'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useFavourites } from '@/lib/context/FavouritesContext';
import HeaderIconWithNotice from '@/components/layout/HeaderIconWithNotice';
import AddedNotice from '@/components/layout/AddedNotice';

/** Header favourites icon: shows how many fabrics are saved, reacts when one is added, links to the list. */
export default function FavouritesIconButton({ sx }: { sx?: SxProps<Theme> }) {
  const { items, lastAdded } = useFavourites();

  return (
    <HeaderIconWithNotice
      icon={<FavoriteBorderIcon />}
      label="Your favourites"
      count={items.length}
      added={lastAdded ? { imageUrl: lastAdded.item.imageUrl, origin: lastAdded.origin, at: lastAdded.at } : null}
      href="/favourites"
      sx={sx}
      renderNotice={(close) => (
        <AddedNotice
          close={close}
          heading="Saved to your favourites"
          imageUrl={lastAdded?.item.imageUrl}
          title={lastAdded?.item.name}
          detail={`${items.length} saved fabric${items.length === 1 ? '' : 's'}`}
          secondary={{ label: 'Keep browsing', onClick: close }}
          primary={{ label: 'View favourites', href: '/favourites' }}
        />
      )}
    />
  );
}
