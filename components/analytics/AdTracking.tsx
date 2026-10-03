'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { GA4_ID, GOOGLE_ADS_ID, META_PIXEL_ID } from '@/lib/analytics/track';
import { CONSENT_STORAGE_KEY, onConsentChange } from '@/lib/consent';
import { recordVisit } from '@/lib/analytics/attribution';

// Reads the saved cookie choice inside the inline snippets, before any tag fires.
const READ_CONSENT = `var jlConsent = null; try { jlConsent = JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}')); } catch (e) {}`;

// Loads Google's tag (GA4 + Google Ads) and the Meta Pixel. Each is skipped when its ID isn't set,
// so nothing loads in development until the IDs are added to the environment.
//
// Both start in "denied" mode until the visitor opts in through the cookie banner: Google's consent
// mode sets no cookies and sends only anonymous, cookieless signals, and the pixel sends nothing.
// A later choice in the banner is applied on the spot, without a reload.
export default function AdTracking() {
  const googleIds = [GA4_ID, GOOGLE_ADS_ID].filter(Boolean) as string[];
  const pathname = usePathname();
  const firstPath = useRef(true);
  const isAdmin = pathname?.startsWith('/admin');

  // The pixel snippet sends the first PageView itself; client-side navigations need their own.
  // (GA4 tracks those automatically through its enhanced-measurement history listener.)
  // Remember where the visitor came from, for the order's "Source" in the admin panel.
  useEffect(() => {
    if (!isAdmin) recordVisit();
  }, [pathname, isAdmin]);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    if (!isAdmin) window.fbq?.('track', 'PageView');
  }, [pathname, isAdmin]);

  useEffect(
    () =>
      onConsentChange(({ analytics, advertising }) => {
        const ads = advertising ? 'granted' : 'denied';
        window.gtag?.('consent', 'update', {
          analytics_storage: analytics ? 'granted' : 'denied',
          ad_storage: ads,
          ad_user_data: ads,
          ad_personalization: ads,
        });
        window.fbq?.('consent', advertising ? 'grant' : 'revoke');
      }),
    []
  );

  // Keep staff browsing the admin panel out of ad audiences and site analytics.
  if (isAdmin) return null;

  return (
    <>
      {googleIds.length > 0 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleIds[0]}`} strategy="afterInteractive" />
          <Script id="google-tag" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
${READ_CONSENT}
var jlAds = jlConsent && jlConsent.advertising ? 'granted' : 'denied';
gtag('consent', 'default', {
  analytics_storage: jlConsent && jlConsent.analytics ? 'granted' : 'denied',
  ad_storage: jlAds,
  ad_user_data: jlAds,
  ad_personalization: jlAds,
  functionality_storage: 'granted',
  security_storage: 'granted'
});
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
${googleIds.map((id) => `gtag('config', '${id}');`).join('\n')}`}
          </Script>
        </>
      )}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
${READ_CONSENT}
fbq('consent', jlConsent && jlConsent.advertising ? 'grant' : 'revoke');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}
