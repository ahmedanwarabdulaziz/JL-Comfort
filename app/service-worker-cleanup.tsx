'use client';

import { useEffect } from 'react';

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // Ignore errors
          });
        });
      });
    }
  }, []);

  return null;
}
