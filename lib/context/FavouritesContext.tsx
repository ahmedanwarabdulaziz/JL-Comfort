'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useUpgradeSavedIds } from '@/lib/context/useUpgradeSavedIds';
import { trackAddToWishlist } from '@/lib/analytics/track';
import type { AddOrigin } from '@/components/layout/HeaderIconWithNotice';

/** What the favourites page needs to draw a card without loading the whole catalog. */
export interface FavouriteItem {
  fabricId: string;
  name: string;
  sku: string;
  imageUrl: string;
  pricePerYard: number | null;
}

export interface LastAddedFavourite {
  item: FavouriteItem;
  origin: AddOrigin | null;
  at: number;
}

interface FavouritesContextType {
  items: FavouriteItem[];
  isFavourite: (fabricId: string) => boolean;
  toggleFavourite: (item: FavouriteItem, origin?: AddOrigin | null) => void;
  removeFavourite: (fabricId: string) => void;
  clearFavourites: () => void;
  lastAdded: LastAddedFavourite | null;
}

const STORAGE_KEY = 'jl_comfort_favourites';
const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

/**
 * The shopper's saved fabrics (our take on Charlotte's "Design Boards"). There are no customer
 * accounts, so the list lives in this browser, like the cart and sample list.
 */
export const FavouritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FavouriteItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastAdded, setLastAdded] = useState<LastAddedFavourite | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to read favourites from local storage', e);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: the list still works for this visit.
    }
  }, [items, loaded]);

  useUpgradeSavedIds(items, setItems);

  const isFavourite = useCallback((fabricId: string) => items.some((i) => i.fabricId === fabricId), [items]);

  const toggleFavourite = useCallback(
    (item: FavouriteItem, origin: AddOrigin | null = null) => {
      if (items.some((i) => i.fabricId === item.fabricId)) {
        setItems((prev) => prev.filter((i) => i.fabricId !== item.fabricId));
        return;
      }
      setItems((prev) => [item, ...prev]);
      setLastAdded({ item, origin, at: Date.now() });
      trackAddToWishlist({ id: item.sku || item.fabricId, name: item.name, category: 'Fabric', price: item.pricePerYard ?? 0, quantity: 1 });
    },
    [items]
  );

  const removeFavourite = useCallback((fabricId: string) => setItems((prev) => prev.filter((i) => i.fabricId !== fabricId)), []);
  const clearFavourites = useCallback(() => setItems([]), []);

  return (
    <FavouritesContext.Provider value={{ items, isFavourite, toggleFavourite, removeFavourite, clearFavourites, lastAdded }}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (!context) throw new Error('useFavourites must be used within a FavouritesProvider');
  return context;
};
