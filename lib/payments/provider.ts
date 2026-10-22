// Which payment service checkout uses. Stripe is the default; PAYMENT_PROVIDER=square switches the
// store to Square (lib/square/server.ts) until Stripe is ready. Read on every call so changing the
// variable in the host's settings and redeploying is all a switch takes.
export type PaymentProvider = 'stripe' | 'square';

export const paymentProvider = (): PaymentProvider =>
  process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === 'square' ? 'square' : 'stripe';
