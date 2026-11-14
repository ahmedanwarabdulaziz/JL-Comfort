'use client';

import { IconButton, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { FavouriteItem, useFavourites } from '@/lib/context/FavouritesContext';
import { originOf } from '@/components/layout/HeaderIconWithNotice';

/** Heart that saves a fabric to (or removes it from) the shopper's favourites. */
export default function FavouriteButton({ item, size = 'small', sx }: { item: FavouriteItem; size?: 'small' | 'medium'; sx?: SxProps<Theme> }) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const saved = isFavourite(item.fabricId);
  const label = saved ? 'Remove from favourites' : 'Save to favourites';

  return (
    <Tooltip title={label} placement="left">
      <IconButton
        size={size}
        aria-label={label}
        aria-pressed={saved}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavourite(item, originOf(e.currentTarget));
        }}
        sx={{ color: saved ? '#9b1b30' : '#8b857e', '&:hover': { color: '#9b1b30' }, ...sx }}
      >
        {saved ? <FavoriteIcon fontSize={size} /> : <FavoriteBorderIcon fontSize={size} />}
      </IconButton>
    </Tooltip>
  );
}
