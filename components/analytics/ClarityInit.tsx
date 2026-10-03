'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { onConsentChange, readConsent } from '@/lib/consent';

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

// Clarity records sessions, so it only starts once the visitor has accepted analytics cookies.
export default function ClarityInit() {
  useEffect(() => {
    if (!CLARITY_PROJECT_ID) return;
    let started = false;
    const apply = (analytics: boolean) => {
      if (analytics && !started) {
        Clarity.init(CLARITY_PROJECT_ID);
        started = true;
      }
      if (started) Clarity.consent(analytics);
    };
    apply(readConsent()?.analytics === true);
    return onConsentChange(({ analytics }) => apply(analytics));
  }, []);

  return null;
}
