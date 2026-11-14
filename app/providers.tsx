'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme';
import { CartProvider } from '@/lib/context/CartContext';
import { SampleCartProvider } from '@/lib/context/SampleCartContext';
import { FavouritesProvider } from '@/lib/context/FavouritesContext';
import SampleListDrawer from '@/components/samples/SampleListDrawer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <SampleCartProvider>
          <FavouritesProvider>
            {children}
            <SampleListDrawer />
          </FavouritesProvider>
        </SampleCartProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
