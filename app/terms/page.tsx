import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import { BUSINESS, LEGAL_LAST_UPDATED, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
  description:
    'The terms that apply when you use the JL Comfort website, request fabric samples or buy fabric, custom foam and cushions from us.',
};

const sections: LegalSection[] = [
  {
    id: 'agreement',
    title: 'About these terms',
    content: (
      <>
        <p>
          These Terms of Service (the &ldquo;Terms&rdquo;) apply to your use of{' '}
          <a href={SITE_URL}>{SITE_URL.replace(/^https?:\/\//, '')}</a> (the &ldquo;Site&rdquo;) and to every sample
          request and order you place with {BUSINESS.legalName}, operating as {SITE_NAME} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;). By using the Site or placing an order, you agree to these Terms and to
          our <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          You must be at least the age of majority in your province or territory, and able to enter into a binding
          contract, to place an order.
        </p>
        <p>
          <strong>Your consumer rights are protected.</strong> Nothing in these Terms limits or excludes any right or
          remedy you have under consumer protection laws that apply to you and cannot be waived, including the Quebec{' '}
          <em>Consumer Protection Act</em>. Where a clause below conflicts with such a law, the law prevails.
        </p>
      </>
    ),
  },
  {
    id: 'products',
    title: 'Our products',
    content: (
      <>
        <h3>Made to order</h3>
        <p>
          Fabric is cut to the length you order, and foam and cushions are cut and made to the dimensions and options
          you choose. Please check your measurements, quantities and selections carefully before you order; our{' '}
          <Link href="/how-to-measure">How to Measure</Link> guide can help. We make your order exactly as you specify
          it and are not responsible for errors in the measurements or choices you provide.
        </p>
        <h3>Colour and appearance</h3>
        <p>
          We show products as accurately as we can, but colours and textures vary between screens, and fabric can vary
          slightly between dye lots. We strongly recommend ordering a free sample before buying fabric. Small variations
          in colour, texture or pattern placement are normal and are not defects.
        </p>
        <h3>Product information</h3>
        <p>
          Specifications such as fibre content, width, durability and care instructions come from our manufacturers and
          suppliers. We try to keep them accurate and complete but cannot guarantee that they are free of errors.
          Foam dimensions may vary within normal manufacturing tolerances.
        </p>
        <h3>Availability</h3>
        <p>
          All products are subject to availability. Fabrics can be discontinued or become temporarily unavailable from
          the mill. If something you ordered is unavailable, we will contact you and, at your choice, offer an
          alternative or a full refund for that item.
        </p>
      </>
    ),
  },
  {
    id: 'samples',
    title: 'Free fabric samples',
    content: (
      <p>
        Free samples are offered for evaluating fabrics before purchase and are subject to availability. We may limit
        the number of samples per request or per customer, and may decline requests that appear to be for resale or
        abuse of the offer. Samples are yours to keep and do not need to be returned. Samples are cut from a single
        roll and may differ slightly from a later dye lot.
      </p>
    ),
  },
  {
    id: 'pricing',
    title: 'Prices, taxes and payment',
    content: (
      <>
        <p>
          All prices are in Canadian dollars (CAD). Applicable taxes (GST, HST, PST or QST) and shipping are calculated
          from your delivery address and shown before you pay. The total shown at checkout is the amount you will be
          charged.
        </p>
        <p>
          Payment is taken at the time of your order through our payment processor, Stripe. We accept the payment
          methods shown at checkout.
        </p>
        <p>
          We work to keep prices accurate. If a product is listed at an obviously incorrect price because of a
          typographical or system error, we will contact you before processing the order and you may choose to proceed
          at the correct price or cancel for a full refund, except where applicable law requires us to honour the
          advertised price.
        </p>
        <p>
          Discount codes are valid only on the terms stated with them, cannot be exchanged for cash, cannot be combined
          unless stated, and may be withdrawn at any time before they are used.
        </p>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Placing and cancelling orders',
    content: (
      <>
        <p>
          Your order is an offer to buy. A contract is formed when we send you an email confirming your order. We may
          decline or cancel an order, with a full refund, if a product is unavailable, if there is an error in the
          price or description, or if we suspect fraud.
        </p>
        <p>
          Because orders are made to order, work begins quickly. You may cancel for a full refund until we have started
          cutting your order or placed it with our supplier. Contact us as soon as possible at{' '}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your order number. Once work has begun, the
          order can no longer be cancelled.
        </p>
      </>
    ),
  },
  {
    id: 'shipping',
    title: 'Shipping and delivery',
    content: (
      <>
        <p>
          We currently ship within Canada only. Estimated delivery times are shown at checkout and are estimates, not
          guarantees; delays by carriers or suppliers can occur. Some items, including fabric, may ship directly from
          our supplier.
        </p>
        <p>
          Ownership of and risk of loss for your order pass to you when it is delivered to the address you provided.
          Please make sure your address is correct: we are not responsible for orders delivered to an incorrect address
          you entered. If your order arrives damaged, please keep the packaging and contact us within 14 days of
          delivery with photos.
        </p>
        <p>
          See <Link href="/shipping-returns">Shipping &amp; Returns</Link> for more detail.
        </p>
      </>
    ),
  },
  {
    id: 'returns',
    title: 'Returns, defects and refunds',
    content: (
      <>
        <p>
          Because every order is cut or made to your specifications, we cannot accept returns or exchanges for a change
          of mind, including for incorrect measurements or selections you provided.
        </p>
        <p>
          If your order arrives damaged, is defective, or does not match what you ordered (for example the wrong
          fabric, size, grade or option), contact us within 14 days of delivery with your order number and photos. We
          will repair or replace the item or give you a full refund, at no cost to you, including return shipping where
          a return is needed.
        </p>
        <p>
          Refunds are issued to the original payment method. Your bank or card issuer may take several business days to
          post them.
        </p>
      </>
    ),
  },
  {
    id: 'warranty',
    title: 'Product warranty',
    content: (
      <>
        <p>
          We warrant that our products will be free from defects in materials and workmanship when delivered. This
          warranty is in addition to any legal warranties you have under the law of your province, which are not
          affected.
        </p>
        <p>
          Normal characteristics of materials are not defects, for example: foam softening gradually with use or
          having a mild odour when first unpacked; natural variations in fabric; and wear, fading, pilling or damage
          from normal use, sunlight, improper cleaning, accidents or misuse. Follow the manufacturer&rsquo;s care
          instructions for your fabric.
        </p>
      </>
    ),
  },
  {
    id: 'site-use',
    title: 'Using the Site',
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the Site for any unlawful or fraudulent purpose, or to place orders with information that isn&rsquo;t yours;</li>
          <li>copy, scrape or harvest content, prices or product data from the Site by automated means;</li>
          <li>interfere with the Site&rsquo;s security or operation, or try to access areas not intended for you; or</li>
          <li>misuse free samples, discount codes or promotions.</li>
        </ul>
        <p>
          The Site&rsquo;s content, including text, graphics, logos and product photographs, belongs to us or our
          licensors and is protected by intellectual property laws. You may view and print pages for your personal,
          non-commercial use only.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    content: (
      <>
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect, incidental, special or
          consequential losses (such as loss of profit or loss of use) arising from your use of the Site or our
          products, and our total liability for any claim related to an order is limited to the amount you paid for
          that order.
        </p>
        <p>
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by our
          negligence, for fraud, or for anything else that cannot be excluded or limited under applicable law,
          including the consumer protection laws of your province. If you are a Quebec consumer, the limitations in this
          section do not apply to the extent they are prohibited by the <em>Consumer Protection Act</em> or the{' '}
          <em>Civil Code of Québec</em>.
        </p>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    content: (
      <>
        <p>
          These Terms are governed by the laws of the Province of {BUSINESS.province} and the federal laws of Canada
          that apply there. If you are a consumer residing in another province or territory, you also keep the benefit
          of any mandatory consumer protection laws of your home province, and you may bring proceedings in its courts
          where the law allows.
        </p>
        <p>
          If you have a concern, please contact us first. Most issues can be resolved quickly and informally.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    content: (
      <p>
        We may update these Terms from time to time. The version in force when you place an order applies to that
        order. The &ldquo;Last updated&rdquo; date at the top shows when the Terms last changed. If any part of these
        Terms is found to be unenforceable, the rest remains in effect.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <p>
        {BUSINESS.legalName}
        <br />
        {BUSINESS.address}
        <br />
        Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        <br />
        Phone: {BUSINESS.phone}
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          Please read these Terms carefully before you order. They explain how ordering works, what to expect with
          made-to-order products, and your rights if something isn&rsquo;t right.
        </p>
      }
      sections={sections}
    />
  );
}
