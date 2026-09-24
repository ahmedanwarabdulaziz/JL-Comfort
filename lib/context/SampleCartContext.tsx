'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_SAMPLE_SETTINGS, SampleRequestItem, SampleSettings } from '@/lib/types/sampleRequest';
import { getSampleSettings } from '@/lib/data/sampleRequests';

interface SampleCartContextType {
  items: SampleRequestItem[];
  addSample: (item: SampleRequestItem) => void;
  removeSample: (fabricId: string) => void;
  clearSamples: () => void;
  isFull: boolean;
  settings: SampleSettings; // admin limits; the server enforces them too
  isListOpen: boolean; // the slide-in sample list (components/samples/SampleListDrawer)
  setListOpen: (open: boolean) => void;
}

const SampleCartContext = createContext<SampleCartContextType | undefined>(undefined);

export const SampleCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<SampleRequestItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<SampleSettings>(DEFAULT_SAMPLE_SETTINGS);
  const [isListOpen, setListOpen] = useState(false);

  useEffect(() => {
    getSampleSettings().then(setSettings).catch(() => {});
  }, []);

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
      if (prev.length >= settings.maxPerRequest) return prev;
      return [...prev, item];
    });
    setListOpen(true); // show the customer what happened and where to go next
  };

  const removeSample = (fabricId: string) => {
    setItems((prev) => prev.filter((i) => i.fabricId !== fabricId));
  };

  const clearSamples = () => setItems([]);

  return (
    <SampleCartContext.Provider
      value={{ items, addSample, removeSample, clearSamples, isFull: items.length >= settings.maxPerRequest, settings, isListOpen, setListOpen }}
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
