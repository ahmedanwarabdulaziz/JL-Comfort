// Ad-platform events (GA4, Google Ads, Meta Pixel). Each call is a no-op when that platform's ID
// isn't set or its script hasn't loaded, so these are safe to call from anywhere on the client.
import type { CartItem } from '@/lib/context/CartContext';

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
const ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;

const CURRENCY = 'CAD';

export interface AnalyticsItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const gtag = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && window.gtag) window.gtag(...args);
};
const fbq = (...args: unknown[]) => {
  if (typeof window !== 'undefined' && window.fbq) window.fbq(...args);
};

// Clarity custom events and tags let session recordings be filtered by what the visitor did
// ("show me sessions that began checkout but didn't buy"). Clarity only runs with analytics consent.
const clarityEvent = (name: string) => {
  if (typeof window !== 'undefined' && window.clarity) window.clarity('event', name);
};
const clarityTag = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.clarity) window.clarity('set', key, value);
};

const round = (n: number) => Math.round(n * 100) / 100;
const totalOf = (items: AnalyticsItem[]) => round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));

const toGaItems = (items: AnalyticsItem[]) =>
  items.map((i) => ({ item_id: i.id, item_name: i.name, item_category: i.category, price: round(i.price), quantity: i.quantity }));

const toMetaParams = (items: AnalyticsItem[], value: number) => ({
  content_ids: items.map((i) => i.id),
  content_type: 'product',
  contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: round(i.price) })),
  num_items: items.reduce((sum, i) => sum + i.quantity, 0),
  value,
  currency: CURRENCY,
});

const CATEGORY_NAMES: Record<string, string> = { foam: 'Custom Foam', benchCushion: 'Bench Cushion', fabric: 'Fabric' };

export function cartItemToAnalytics(item: Omit<CartItem, 'id'>): AnalyticsItem {
  const type = item.productType || 'foam';
  return {
    id: item.fabricSku || item.fabricId || item.cushionStyleId || item.typeId || type,
    name: item.fabricName || item.cushionStyleName || item.typeName || CATEGORY_NAMES[type],
    category: CATEGORY_NAMES[type],
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export function trackViewItem(item: AnalyticsItem) {
  gtag('event', 'view_item', { currency: CURRENCY, value: round(item.price), items: toGaItems([item]) });
  fbq('track', 'ViewContent', { ...toMetaParams([item], round(item.price)), content_name: item.name });
  clarityEvent('view_item');
}

export function trackAddToCart(item: AnalyticsItem) {
  const value = totalOf([item]);
  gtag('event', 'add_to_cart', { currency: CURRENCY, value, items: toGaItems([item]) });
  fbq('track', 'AddToCart', { ...toMetaParams([item], value), content_name: item.name });
  clarityEvent('add_to_cart');
  clarityTag('added_to_cart', 'yes');
}

export function trackBeginCheckout(items: AnalyticsItem[]) {
  const value = totalOf(items);
  gtag('event', 'begin_checkout', { currency: CURRENCY, value, items: toGaItems(items) });
  fbq('track', 'InitiateCheckout', toMetaParams(items, value));
  clarityEvent('begin_checkout');
  clarityTag('began_checkout', 'yes');
}

export function trackPurchase(order: {
  transactionId: string;
  value: number;
  tax?: number;
  shipping?: number;
  sha256Email?: string; // for Google Ads enhanced conversions; only sent with advertising consent
}) {
  const value = round(order.value);
  if (order.sha256Email) gtag('set', 'user_data', { sha256_email_address: order.sha256Email });
  gtag('event', 'purchase', {
    transaction_id: order.transactionId,
    currency: CURRENCY,
    value,
    tax: order.tax,
    shipping: order.shipping,
  });
  if (GOOGLE_ADS_ID && ADS_PURCHASE_LABEL) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${ADS_PURCHASE_LABEL}`,
      value,
      currency: CURRENCY,
      transaction_id: order.transactionId,
    });
  }
  // eventID lets Meta de-duplicate this against a server-side Conversions API event later on.
  fbq('track', 'Purchase', { value, currency: CURRENCY }, { eventID: order.transactionId });
  clarityEvent('purchase');
  clarityTag('purchased', 'yes');
  // Lets you find the recording for an order: Clarity > Recordings > filter by custom tag order_number.
  clarityTag('order_number', order.transactionId);
  clarityTag('order_value', String(value));
}

// A free-sample request: the main non-purchase conversion on the site.
export function trackSampleRequest(sampleCount: number) {
  gtag('event', 'generate_lead', { currency: CURRENCY, value: 0, sample_count: sampleCount });
  if (GOOGLE_ADS_ID && ADS_LEAD_LABEL) {
    gtag('event', 'conversion', { send_to: `${GOOGLE_ADS_ID}/${ADS_LEAD_LABEL}` });
  }
  fbq('track', 'Lead', { content_name: 'Fabric samples', num_items: sampleCount });
  clarityEvent('sample_request');
  clarityTag('requested_samples', 'yes');
}

// ---- Browsing and cart journey (GA4 recommended ecommerce events) ----

export function trackViewItemList(listName: string, items: AnalyticsItem[]) {
  gtag('event', 'view_item_list', { item_list_name: listName, items: toGaItems(items.slice(0, 20)) });
}

export function trackSelectItem(listName: string, item: AnalyticsItem) {
  gtag('event', 'select_item', { item_list_name: listName, items: toGaItems([item]) });
}

export function trackSearch(term: string, resultCount: number) {
  gtag('event', 'search', { search_term: term, result_count: resultCount });
  fbq('track', 'Search', { search_string: term });
  clarityEvent('search');
  if (resultCount === 0) clarityTag('search_no_results', term.slice(0, 100));
}

export function trackFilter(filterName: string, value: string) {
  gtag('event', 'filter_fabrics', { filter_name: filterName, filter_value: value });
}

export function trackRemoveFromCart(item: AnalyticsItem) {
  gtag('event', 'remove_from_cart', { currency: CURRENCY, value: totalOf([item]), items: toGaItems([item]) });
  clarityEvent('remove_from_cart');
}

export function trackViewCart(items: AnalyticsItem[]) {
  gtag('event', 'view_cart', { currency: CURRENCY, value: totalOf(items), items: toGaItems(items) });
  clarityEvent('view_cart');
}

// The shopper picked a province and got a shipping + tax quote.
export function trackAddShippingInfo(items: AnalyticsItem[], shippingTier: string) {
  gtag('event', 'add_shipping_info', { currency: CURRENCY, value: totalOf(items), shipping_tier: shippingTier, items: toGaItems(items) });
  clarityEvent('add_shipping_info');
}

// The shopper is being sent to Stripe to pay.
export function trackAddPaymentInfo(items: AnalyticsItem[]) {
  const value = totalOf(items);
  gtag('event', 'add_payment_info', { currency: CURRENCY, value, payment_type: 'stripe', items: toGaItems(items) });
  fbq('track', 'AddPaymentInfo', { value, currency: CURRENCY });
  clarityEvent('add_payment_info');
  clarityTag('reached_payment', 'yes');
}

export function trackAddSample(fabricId: string, name: string) {
  gtag('event', 'add_sample', { item_id: fabricId, item_name: name });
  fbq('trackCustom', 'AddSample', { content_ids: [fabricId], content_name: name });
  clarityEvent('add_sample');
}
