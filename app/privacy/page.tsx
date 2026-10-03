import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection } from '@/components/legal/LegalPage';
import CookieSettingsLink from '@/components/consent/CookieSettingsLink';
import { BUSINESS, LEGAL_LAST_UPDATED, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
  description:
    'How JL Comfort collects, uses, shares and protects your personal information, the cookies we use, and your privacy rights under Canadian law.',
};

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are and what this policy covers',
    content: (
      <>
        <p>
          {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is operated by {BUSINESS.legalName},{' '}
          {BUSINESS.address}. We sell upholstery fabric, custom-cut foam and made-to-order cushions online at{' '}
          <a href={SITE_URL}>{SITE_URL.replace(/^https?:\/\//, '')}</a> (the &ldquo;Site&rdquo;).
        </p>
        <p>
          This policy explains how we handle personal information when you visit the Site, request fabric samples,
          place an order or contact us. It is written to meet the <em>Personal Information Protection and Electronic
          Documents Act</em> (PIPEDA), Quebec&rsquo;s <em>Act respecting the protection of personal information in
          the private sector</em> (as amended by Law 25), and other applicable Canadian privacy laws.
        </p>
        <p>
          &ldquo;Personal information&rdquo; means information about an identifiable individual, such as your name,
          email address, shipping address or order history.
        </p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Order details:</strong> your name, email address, phone number (optional), shipping address, and
            the products, sizes, measurements and fabrics you order.
          </li>
          <li>
            <strong>Sample requests:</strong> your name, email address, phone number (optional), mailing address and
            the fabrics you ask for.
          </li>
          <li>
            <strong>Messages:</strong> anything you send us by email or phone, including photos you share about an
            order.
          </li>
          <li>
            <strong>Discount codes</strong> you enter at checkout, and the email address they&rsquo;re used with.
          </li>
        </ul>

        <h3>Payment information</h3>
        <p>
          Payments are processed by <strong>Stripe</strong>. Your card details are entered on Stripe&rsquo;s secure
          checkout page and go directly to Stripe; we never see or store your full card number. Stripe shares with us
          only what we need to confirm and manage your order, such as the payment status, amount, billing address and
          the last four digits and brand of your card.
        </p>

        <h3>Information collected automatically</h3>
        <p>
          When you use the Site, our servers and service providers automatically receive technical information such
          as your IP address, browser and device type, the pages you visit, the website that referred you, and the
          date and time of your visit. If you agree to analytics or advertising cookies, we also collect information
          about how you interact with the Site, as described in <a href="#cookies">Cookies and similar
          technologies</a>.
        </p>

        <p>
          We do not knowingly collect sensitive information (for example health, financial account or government ID
          information), and we ask that you not send it to us.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    content: (
      <>
        <p>We use personal information only for purposes a reasonable person would consider appropriate, namely to:</p>
        <ul>
          <li>process, make, ship and deliver your orders and sample requests;</li>
          <li>calculate shipping costs and applicable taxes;</li>
          <li>send order confirmations, shipping and tracking updates, and other messages about your purchase;</li>
          <li>answer your questions and handle returns, replacements, refunds and warranty issues;</li>
          <li>apply discount codes and prevent their misuse;</li>
          <li>detect and prevent fraud, abuse and security incidents;</li>
          <li>keep accounting and tax records and meet our other legal obligations;</li>
          <li>with your consent, understand how the Site is used so we can improve it (analytics); and</li>
          <li>with your consent, measure the performance of our advertising and show you relevant ads on other platforms.</li>
        </ul>
        <p>
          We do not use your information to make decisions about you based solely on automated processing.
        </p>
      </>
    ),
  },
  {
    id: 'consent',
    title: 'Consent',
    content: (
      <>
        <p>
          We collect, use and share personal information with your consent, except where the law allows otherwise.
          When you place an order or request samples, you consent to us using your information to fulfil that
          request as described in this policy. Analytics and advertising cookies are used only if you opt in through
          our cookie banner.
        </p>
        <p>
          You may withdraw your consent at any time, subject to legal or contractual restrictions and reasonable
          notice. For cookies, use <CookieSettingsLink />. For anything else, contact our Privacy Officer (see{' '}
          <a href="#contact">Contact us</a>). If you withdraw consent to information we need to fulfil an order, we may
          be unable to complete it.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: (
      <>
        <p>
          Cookies and similar technologies (such as local storage and pixels) are small pieces of data stored on your
          device. We group them into three categories. Only the first is used without your permission; the other two
          are off until you opt in.
        </p>
        <h3>Strictly necessary</h3>
        <p>
          These keep your shopping cart and sample list, remember your cookie choice, and protect checkout and our
          admin systems. The Site cannot work properly without them.
        </p>
        <h3>Analytics (optional)</h3>
        <p>
          <strong>Google Analytics</strong> and <strong>Microsoft Clarity</strong> help us understand how visitors use
          the Site, for example which pages are popular and where people run into problems. Clarity may record how
          you move through pages (mouse movements, clicks and scrolling); text you type into forms is masked and not
          recorded.
        </p>
        <h3>Advertising (optional)</h3>
        <p>
          <strong>Google Ads</strong> and the <strong>Meta Pixel</strong> (Facebook and Instagram) tell us whether our
          ads lead to visits, sample requests and purchases, and let these platforms show you more relevant ads. They
          may combine this with information they already hold about you under their own privacy policies.
        </p>
        <p>
          If you have accepted advertising cookies, when you complete a purchase our server also reports it directly to
          Google and Meta so it is counted even if your browser blocks their tags. This report includes the order
          value and items and, for Meta, your contact and shipping details in hashed (one-way encrypted) form, your IP
          address and browser type, which Meta uses only to match the purchase to an ad you saw. With analytics
          consent only, we report the purchase to Google Analytics without any contact details.
        </p>
        <h3>How you found us</h3>
        <p>
          We note how you arrived at the Site (for example the website, search engine or ad campaign that referred
          you, and the first page you visited) in your browser&rsquo;s storage, and save it with your order when you
          buy. This tells us which of our marketing is working. It contains no information about your activity on
          other websites.
        </p>
        <p>
          When you have not opted in, Google&rsquo;s tags operate in a restricted &ldquo;consent mode&rdquo;: they set
          no advertising or analytics cookies and send only limited, cookieless signals that Google uses in aggregate.
          The Meta Pixel sends nothing.
        </p>
        <h3>Managing your choices</h3>
        <p>
          You can change your choices at any time using <CookieSettingsLink />, which is also linked at the bottom of
          every page. You can also block or delete cookies through your browser settings, and manage ad
          personalisation directly with{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google</a> and{' '}
          <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">Meta</a>.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'How we share information',
    content: (
      <>
        <p>
          <strong>We do not sell or rent your personal information.</strong> We share it only with the following
          parties, and only as needed for the purposes above:
        </p>
        <ul>
          <li><strong>Payment processing:</strong> Stripe.</li>
          <li>
            <strong>Fabric suppliers:</strong> when a supplier ships fabric or samples directly to you, we give them
            your name, shipping address and the items ordered.
          </li>
          <li>
            <strong>Shipping carriers</strong> such as Canada Post, UPS, FedEx and Purolator, to deliver your order.
          </li>
          <li>
            <strong>Technology providers</strong> that host and run the Site and our operations: Netlify (website
            hosting), Supabase and Google Firebase (databases), Cloudflare (file storage) and Resend (email delivery).
          </li>
          <li>
            <strong>Analytics and advertising partners</strong> (Google, Microsoft and Meta), only if you have opted in
            to those cookies.
          </li>
          <li>
            <strong>Professional advisers</strong> such as accountants and lawyers, under a duty of confidentiality.
          </li>
          <li>
            <strong>Authorities</strong>, where required by law, court order or to protect the rights, property or
            safety of our customers, the public or us.
          </li>
          <li>
            <strong>A successor business</strong>, if all or part of our business is sold or reorganised, in which case
            the information will remain protected as described in this policy.
          </li>
        </ul>
        <p>
          Our service providers may use your information only to provide services to us, and we require them by
          contract to protect it with safeguards comparable to our own.
        </p>
      </>
    ),
  },
  {
    id: 'outside-canada',
    title: 'Storage and processing outside Canada',
    content: (
      <>
        <p>
          Some of our service providers store or process information outside Quebec and outside Canada, mainly in the
          United States. Before sharing information outside Quebec, we assess whether it will receive adequate
          protection. While it is held in another country, it is subject to that country&rsquo;s laws and may be
          accessible to its courts, law enforcement and national security authorities.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep information',
    content: (
      <>
        <p>We keep personal information only as long as we need it for the purposes it was collected for, or as the law requires:</p>
        <ul>
          <li>
            <strong>Orders and payment records:</strong> for at least six years after the end of the tax year they
            relate to, as required by Canadian tax law.
          </li>
          <li><strong>Sample requests:</strong> up to 24 months, so we can help you with a later order.</li>
          <li><strong>Messages and support requests:</strong> up to 24 months after the matter is resolved.</li>
          <li>
            <strong>Analytics data:</strong> generally no longer than 14 months, in pseudonymous or aggregated form.
          </li>
        </ul>
        <p>When information is no longer needed, we securely delete or anonymise it.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect information',
    content: (
      <>
        <p>
          We use physical, organisational and technical safeguards appropriate to the sensitivity of the information,
          including encrypted connections (HTTPS), payment handling by a PCI-DSS certified processor, access controls
          that limit personal information to staff who need it, and reputable service providers with strong security
          programs.
        </p>
        <p>
          No method of transmission or storage is completely secure. If a breach of security safeguards involving
          your personal information creates a real risk of significant harm, we will notify you and the relevant
          privacy regulator as required by law.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your privacy rights',
    content: (
      <>
        <p>Subject to limited exceptions under the law, you have the right to:</p>
        <ul>
          <li>know whether we hold personal information about you, and access it;</li>
          <li>have inaccurate or incomplete information corrected;</li>
          <li>withdraw your consent, as described above;</li>
          <li>ask us to delete information we no longer need to keep;</li>
          <li>
            if you live in Quebec, receive computerised personal information you provided in a structured, commonly
            used technological format (data portability), and ask us to stop disseminating or to de-index information
            where the law allows; and
          </li>
          <li>ask how your information is used and to whom it has been disclosed.</li>
        </ul>
        <p>
          To make a request, contact our Privacy Officer (see <a href="#contact">Contact us</a>). We may need to verify
          your identity before responding. We will respond within 30 days, free of charge except where the law allows a
          reasonable fee, which we will tell you about in advance. If we refuse a request, we will explain why and
          describe the remedies available to you.
        </p>
      </>
    ),
  },
  {
    id: 'emails',
    title: 'Emails from us',
    content: (
      <>
        <p>
          We send transactional messages about your orders and sample requests, such as confirmations and shipping
          updates. We will send promotional emails only if you have given us your consent, as required by
          Canada&rsquo;s Anti-Spam Legislation (CASL), and every promotional email will include a simple way to
          unsubscribe.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <p>
        The Site is intended for adults. We do not knowingly collect personal information from anyone under 16. If you
        believe a child has given us personal information, please contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'third-party-links',
    title: 'Links to other websites',
    content: (
      <p>
        The Site may link to websites we don&rsquo;t control, such as carrier tracking pages and social media. Their
        privacy practices are governed by their own policies, which we encourage you to read.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top shows when it last
        changed. If we make a significant change to how we use your personal information, we will let you know on the
        Site and, where required, ask for your consent.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <>
        <p>
          Our Privacy Officer is responsible for our compliance with this policy and with privacy law. For questions,
          requests or complaints about your personal information, contact:
        </p>
        <p>
          <strong>{BUSINESS.privacyOfficer}</strong>, Privacy Officer
          <br />
          {BUSINESS.legalName}
          <br />
          {BUSINESS.address}
          <br />
          Email: <a href={`mailto:${BUSINESS.privacyEmail}`}>{BUSINESS.privacyEmail}</a>
          <br />
          Phone: {BUSINESS.phone}
        </p>
        <p>
          If you are not satisfied with our response, you may contact the{' '}
          <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">Office of the Privacy Commissioner of Canada</a>
          {' '}or, if you live in Quebec, the{' '}
          <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer">Commission d&rsquo;accès à l&rsquo;information du Québec</a>.
          Residents of Alberta and British Columbia may also contact their provincial privacy commissioner.
        </p>
        <p>
          See also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={
        <p>
          Your privacy matters to us. This policy explains, in plain language, what personal information {SITE_NAME}{' '}
          collects, why we collect it, who we share it with, how long we keep it, and the choices and rights you have.
        </p>
      }
      sections={sections}
    />
  );
}
