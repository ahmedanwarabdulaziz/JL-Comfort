'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '@/lib/context/CartContext';
import HeaderIconWithNotice from '@/components/layout/HeaderIconWithNotice';
import AddedNotice from '@/components/layout/AddedNotice';

/** Header cart icon: highlights itself when something is added to the cart, links to the cart. */
export default function CartIconButton({ sx }: { sx?: SxProps<Theme> }) {
  const { items, lastAdded, cartTotal } = useCart();
  const item = lastAdded?.item;

  const detail = item
    ? item.productType === 'fabric'
      ? `${item.quantity} yard${item.quantity === 1 ? '' : 's'} · $${item.totalPrice.toFixed(2)} CAD`
      : `${item.quantity} × $${item.unitPrice.toFixed(2)} CAD`
    : undefined;
  const title = item
    ? item.productType === 'fabric'
      ? item.fabricName
      : item.productType === 'benchCushion'
      ? item.cushionStyleName
      : `${item.categoryName} - ${item.typeName}`
    : undefined;

  return (
    <HeaderIconWithNotice
      icon={<ShoppingCartOutlinedIcon />}
      label="Your cart"
      count={items.length}
      added={lastAdded ? { imageUrl: lastAdded.imageUrl, origin: lastAdded.origin, at: lastAdded.at } : null}
      href="/checkout"
      sx={sx}
      renderNotice={(close) => (
        <AddedNotice
          close={close}
          heading="Added to your cart"
          imageUrl={lastAdded?.imageUrl}
          title={title}
          detail={detail ? `${detail} · cart $${cartTotal.toFixed(2)}` : undefined}
          secondary={{ label: 'View cart', href: '/checkout' }}
          primary={{ label: 'Checkout', href: '/checkout/shipping' }}
        />
      )}
    />
  );
}
