'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { effectiveConsent, onConsentChange } from '@/lib/consent';

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

// Clarity records sessions, so it only starts while analytics cookies are allowed (the visitor's
// choice, or the regional default -- see lib/consent.ts).
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
    apply(effectiveConsent().analytics);
    return onConsentChange(({ analytics }) => apply(analytics));
  }, []);

  return null;
}
