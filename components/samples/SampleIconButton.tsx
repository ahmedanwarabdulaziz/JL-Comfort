'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import { useSampleCart } from '@/lib/context/SampleCartContext';
import HeaderIconWithNotice from '@/components/layout/HeaderIconWithNotice';
import AddedNotice from '@/components/layout/AddedNotice';

/** Header free-samples icon: highlights itself when a sample is added, opens the sample list. */
export default function SampleIconButton({ sx }: { sx?: SxProps<Theme> }) {
  const { items, setListOpen, lastAdded, settings } = useSampleCart();

  return (
    <HeaderIconWithNotice
      icon={<StyleOutlinedIcon />}
      label="Your free samples"
      count={items.length}
      added={lastAdded ? { imageUrl: lastAdded.item.imageUrl, origin: lastAdded.origin, at: lastAdded.at } : null}
      onClick={() => setListOpen(true)}
      sx={sx}
      renderNotice={(close) => (
        <AddedNotice
          close={close}
          heading="Added to your samples"
          imageUrl={lastAdded?.item.imageUrl}
          title={lastAdded?.item.name}
          detail={`${items.length} of ${settings.maxPerRequest} free samples`}
          secondary={{ label: 'View list', onClick: () => setListOpen(true) }}
          primary={{ label: 'Request samples', href: '/request-samples' }}
        />
      )}
    />
  );
}
