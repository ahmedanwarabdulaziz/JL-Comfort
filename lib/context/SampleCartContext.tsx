'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_SAMPLE_SETTINGS, SampleRequestItem, SampleSettings } from '@/lib/types/sampleRequest';
import { getSampleSettings } from '@/lib/data/sampleRequests';

/** Where the "add sample" click happened, so the header can animate the swatch flying to its icon. */
export interface SampleOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LastAddedSample {
  item: SampleRequestItem;
  origin: SampleOrigin | null;
  at: number; // changes on every add, so the header reacts even to the same fabric twice
}

interface SampleCartContextType {
  items: SampleRequestItem[];
  addSample: (item: SampleRequestItem, origin?: SampleOrigin | null) => void;
  lastAdded: LastAddedSample | null; // drives the header icon highlight (components/samples/SampleIconButton)
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
  const [lastAdded, setLastAdded] = useState<LastAddedSample | null>(null);

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

  const addSample = (item: SampleRequestItem, origin: SampleOrigin | null = null) => {
    if (items.some((i) => i.fabricId === item.fabricId) || items.length >= settings.maxPerRequest) return;
    setItems((prev) => [...prev, item]);
    setLastAdded({ item, origin, at: Date.now() });
  };

  const removeSample = (fabricId: string) => {
    setItems((prev) => prev.filter((i) => i.fabricId !== fabricId));
  };

  const clearSamples = () => setItems([]);

  return (
    <SampleCartContext.Provider
      value={{ items, addSample, removeSample, clearSamples, isFull: items.length >= settings.maxPerRequest, settings, isListOpen, setListOpen, lastAdded }}
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
