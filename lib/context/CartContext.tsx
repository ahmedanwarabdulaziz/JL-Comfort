'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AddOrigin } from '@/components/layout/HeaderIconWithNotice';

export interface LastAddedCartItem {
  item: CartItem;
  imageUrl?: string;
  origin: AddOrigin;
  at: number;
}

export interface CushionCartOption {
  groupName: string;
  choiceLabel: string;
  priceModifier: number;
  imageUrl?: string | null;
}

export interface CushionFabricSelection {
  id: string;
  name: string;
  imageUrl: string;
  source: 'charlotte-fabrics' | 'jl-comfort';
  productUrl?: string;
  tierName?: string;
  pricePerYard?: number;
  estimatedYards?: number;
  cost?: number;
}

export interface CartItem {
  id: string;
  productType?: 'foam' | 'benchCushion' | 'fabric'; // absent means 'foam', for backward compatibility

  // Foam-specific fields
  categoryId?: string;
  categoryName?: string;
  typeId?: string;
  typeName?: string;
  dimensions?: {
    thickness: number;
    depth: number;
    width: number;
    rawThickness?: number; // absent on carts saved before server-side repricing
    rawDepth: number;
    rawWidth: number;
  };
  gradeId?: string;
  gradeName?: string;
  wrapId?: string;
  wrapName?: string;

  // Bench cushion-specific fields
  cushionStyleId?: string;
  cushionStyleName?: string;
  cushionDimensions?: Record<string, number>;
  cushionOptions?: CushionCartOption[];
  fabric?: CushionFabricSelection;

  // Fabric-as-a-standalone-product fields. quantity is yards directly, whole-yard increments only
  // (updateQuantity below already rejects anything below 1).
  fabricId?: string;
  fabricSku?: string;
  fabricName?: string;
  fabricImageUrl?: string;

  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  // With an origin (the clicked button's position) the header cart icon highlights itself; without
  // one the page's slide-out cart opens instead (foam and bench cushion pages).
  addToCart: (item: Omit<CartItem, 'id'>, origin?: AddOrigin | null) => void;
  lastAdded: LastAddedCartItem | null;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncPrices: (prices: { itemId: string; unitPriceCents: number }[]) => boolean;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<LastAddedCartItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem('jl_comfort_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('jl_comfort_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (newItem: Omit<CartItem, 'id'>, origin: AddOrigin | null = null) => {
    const id = Math.random().toString(36).substring(2, 9);
    setItems((prev) => [...prev, { ...newItem, id }]);
    if (origin) {
      const image = newItem.fabricImageUrl || newItem.fabric?.imageUrl;
      setLastAdded({ item: { ...newItem, id }, imageUrl: image, origin, at: Date.now() });
    } else {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Applies server-verified unit prices (from /api/checkout/quote). Returns true if anything changed,
  // e.g. an admin repriced an item after it was added, so the page can tell the customer.
  const syncPrices = (prices: { itemId: string; unitPriceCents: number }[]) => {
    const byId = new Map(prices.map((p) => [p.itemId, p.unitPriceCents / 100]));
    const changed = items.some((item) => byId.has(item.id) && Math.round(item.unitPrice * 100) !== Math.round(byId.get(item.id)! * 100));
    if (changed) {
      setItems((prev) =>
        prev.map((item) => {
          const unitPrice = byId.get(item.id);
          return unitPrice === undefined ? item : { ...item, unitPrice, totalPrice: unitPrice * item.quantity };
        })
      );
    }
    return changed;
  };

  const cartTotal = items.reduce((total, item) => total + item.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        lastAdded,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncPrices,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
