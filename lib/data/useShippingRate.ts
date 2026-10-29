'use client';

import { useEffect, useState } from 'react';
import { getShippingRate } from '@/lib/data/shippingRates';
import { ShippingRate } from '@/lib/types/checkout';

// Canada's shipping rate for the storefront's "free shipping over $X" messages (announcement bar,
// cart, product page). Fetched once per page load and shared, since several components show it.
let pending: Promise<ShippingRate | null> | null = null;

export function useShippingRate(): ShippingRate | null {
  const [rate, setRate] = useState<ShippingRate | null>(null);
  useEffect(() => {
    pending ??= getShippingRate('CA').catch(() => null);
    let active = true;
    pending.then((value) => active && setRate(value));
    return () => {
      active = false;
    };
  }, []);
  return rate;
}

// The free-shipping threshold, or null when there is none (or shipping rates are switched off).
export function useFreeShippingOver(): number | null {
  const rate = useShippingRate();
  return rate?.enabled && rate.freeShippingOver !== null ? rate.freeShippingOver : null;
}
