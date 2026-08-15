'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SampleRequestItem } from '@/lib/types/sampleRequest';

export const MAX_SAMPLE_ITEMS = 5;

interface SampleCartContextType {
  items: SampleRequestItem[];
  addSample: (item: SampleRequestItem) => void;
  removeSample: (fabricId: string) => void;
  clearSamples: () => void;
  isFull: boolean;
}

const SampleCartContext = createContext<SampleCartContextType | undefined>(undefined);

export const SampleCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<SampleRequestItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('jl_comfort_sample_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse sample cart from local storage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('jl_comfort_sample_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addSample = (item: SampleRequestItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.fabricId === item.fabricId)) return prev;
      if (prev.length >= MAX_SAMPLE_ITEMS) return prev;
      return [...prev, item];
    });
  };

  const removeSample = (fabricId: string) => {
    setItems((prev) => prev.filter((i) => i.fabricId !== fabricId));
  };

  const clearSamples = () => setItems([]);

  return (
    <SampleCartContext.Provider
      value={{ items, addSample, removeSample, clearSamples, isFull: items.length >= MAX_SAMPLE_ITEMS }}
    >
      {children}
    </SampleCartContext.Provider>
  );
};

export const useSampleCart = () => {
  const context = useContext(SampleCartContext);
  if (context === undefined) {
    throw new Error('useSampleCart must be used within a SampleCartProvider');
  }
  return context;
};
