import type { Metadata } from 'next';
import { FOAM_PRODUCTS_LIVE } from '@/lib/site';
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import Link from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const metadata: Metadata = {
  title: 'FAQ',
  alternates: { canonical: '/faq' },
  description: FOAM_PRODUCTS_LIVE
    ? 'Answers to common questions about upholstery fabric, samples, custom-cut foam, shipping and returns.'
    : 'Answers to common questions about buying upholstery fabric online in Canada: samples, yardage, durability, cleaning codes, shipping and returns.',
};

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqGroup {
  category: string;
  items: FaqItem[];
}

const linkSx = { color: '#b8935f' };

const fabricGroups: FaqGroup[] = [
  {
    category: 'Fabric & Samples',
    items: [
      {
        question: 'Can I get a fabric sample before I order?',
        answer: (
          <>
            Yes, samples are free. Screens show colour and texture differently, so we recommend seeing a sample in your
            own light before ordering yardage. Use <strong>Order free sample</strong> on any fabric page, or browse our{' '}
            <Link href="/sample-books" style={linkSx}>sample books</Link>.
          </>
        ),
      },
      {
        question: 'Do you sell Charlotte Fabrics in Canada?',
        answer: (
          <>
            Yes. We sell the <Link href="/fabrics/charlotte-fabrics" style={linkSx}>Charlotte Fabrics</Link> range by the
            yard, priced in Canadian dollars and shipped across Canada.
          </>
        ),
      },
      {
        question: 'I have a pattern number. How do I find the fabric?',
        answer: (
          <>
            Charlotte fabrics are named by pattern number and colour, such as D2215 Sky. Search for the number in the{' '}
            <Link href="/fabrics" style={linkSx}>fabric shop</Link> to go straight to it and see its other colourways.
          </>
        ),
      },
      {
        question: 'How much fabric do I need?',
        answer: (
          <>
            For a 54-inch-wide plain fabric, a dining chair seat takes about 1 yard, an armchair 6 to 8 yards, a loveseat 10 to 12 yards
            and a three-seat sofa 14 to 18 yards. Patterns with a large repeat need more, so allow an extra 10 to 20 percent. See our{' '}
            <Link href="/guides/how-much-fabric-do-i-need" style={linkSx}>yardage guide and calculator</Link>; every fabric page also has
            a chart for that fabric, and your upholsterer can confirm the exact amount.
          </>
        ),
      },
      {
        question: 'Is fabric sold in whole yards?',
        answer: 'Yes. Fabric is cut to order and sold in 1-yard increments.',
      },
    ],
  },
  {
    category: 'Choosing a Fabric',
    items: [
      {
        question: 'What do double rubs mean?',
        answer:
          'Double rubs (the Wyzenbeek test) measure how much abrasion a fabric withstands. Around 15,000 suits light home use, 30,000 or more suits everyday furniture, and 100,000 or more is heavy duty, suitable for family sofas and commercial seating.',
      },
      {
        question: 'What do the cleaning codes mean?',
        answer:
          'W: clean with water-based cleaners. S: solvent-based cleaners only, no water. W/S or SW: either kind. X: vacuum or brush only. Bleach cleanable fabrics can also be cleaned with a diluted bleach solution. Always test a hidden area first.',
      },
      {
        question: 'Which fabrics are best with pets and kids?',
        answer: (
          <>
            Look for tight weaves with high double rubs and stain resistance. Our{' '}
            <Link href="/fabrics/pet-friendly" style={linkSx}>pet-friendly</Link>,{' '}
            <Link href="/fabrics/performance" style={linkSx}>performance</Link> and{' '}
            <Link href="/fabrics/crypton" style={linkSx}>Crypton</Link> collections are chosen for exactly that.
          </>
        ),
      },
      {
        question: 'Do you have fabric for outdoor cushions?',
        answer: (
          <>
            Yes. Our <Link href="/fabrics/outdoor" style={linkSx}>outdoor and marine fabrics</Link> resist fading,
            moisture and mildew for patios, decks, boats and cottages.
          </>
        ),
      },
    ],
  },
];

const foamGroups: FaqGroup[] = [
  {
    category: 'Ordering & Measuring',
    items: [
      {
        question: 'How do I measure for my custom foam?',
        answer: (
          <>
            Measure thickness, depth, and width in inches. Thickness is cut in whole inches (1&Prime;&ndash;7&Prime;),
            while depth and width are rounded up to our nearest standard foam block size, so you always get enough
            material to cover your cushion. See our full{' '}
            <Link href="/how-to-measure" style={{ color: '#b8935f' }}>How to Measure guide</Link> for step-by-step
            instructions.
          </>
        ),
      },
      {
        question: 'What if my cushion is wider or deeper than a standard foam block?',
        answer:
          'Pieces longer than 81" are expertly seamed together from two blocks and glued so the finished cushion behaves as one solid piece. This is noted as "Join Required" in your order summary before you check out.',
      },
      {
        question: 'Can I order a shape other than square or rectangular?',
        answer:
          'Yes. Choose from the category list in Step 1 of the order wizard — we support a range of common cushion shapes beyond square and rectangular.',
      },
    ],
  },
  {
    category: 'Foam & Materials',
    items: [
      {
        question: 'What foam grade should I choose?',
        answer: (
          <>
            It depends on how the cushion will be used and how firm you like your seating. Our{' '}
            <Link href="/firmness-guide" style={{ color: '#b8935f' }}>firmness guide</Link> walks through all four
            NeoGel compressions — Medium, Medium Firm, Firm, and XX-Firm — and where each works best.
          </>
        ),
      },
      {
        question: 'What is fibre wrap and do I need it?',
        answer: (
          <>
            Fibre wrap (Dacron) is a soft batting layer added around the foam core. It rounds off sharp foam edges,
            fills out your fabric cover more smoothly, and adds a touch of extra softness on top of the support the
            foam provides. It’s optional — see our{' '}
            <Link href="/fibre-wrap" style={{ color: '#b8935f' }}>fibre wrap guide</Link> for details.
          </>
        ),
      },
      {
        question: 'What is NeoGel foam made of?',
        answer:
          'NeoGel is a high-density polyurethane foam. We offer it in four compressions so the same durable foam family covers everything from a soft seat to a firm mattress core.',
      },
    ],
  },
];

const sharedGroups: FaqGroup[] = [
  {
    category: 'Shipping & Turnaround',
    items: [
      {
        question: 'How long does an order take?',
        answer:
          'Every order is cut to order, so please allow 3–5 business days for us to cut and ship it, then a few business days for delivery. Full details are on our Shipping & Returns page.',
      },
      {
        question: 'Where do you ship?',
        answer: (
          <>
            We ship across Canada, and prices are in Canadian dollars. Shipping and tax are shown at checkout before
            you pay. See our{' '}
            <Link href="/shipping-returns" style={{ color: '#b8935f' }}>Shipping & Returns</Link> page for current
            details.
          </>
        ),
      },
    ],
  },
  {
    category: 'Returns & Guarantees',
    items: [
      {
        question: FOAM_PRODUCTS_LIVE ? 'Can I return fabric or foam?' : 'Can I return fabric?',
        answer: (
          <>
            Because fabric is cut to the yardage you order{FOAM_PRODUCTS_LIVE ? ' and foam to your dimensions' : ''}, we
            can&rsquo;t accept returns for a change of mind, so please order a free sample first. If your order arrives
            damaged, is defective or isn&rsquo;t what you ordered, contact us within 14 days of delivery and we&rsquo;ll
            replace or refund it at no cost. See our{' '}
            <Link href="/shipping-returns#returns" style={{ color: '#b8935f' }}>return policy</Link>.
          </>
        ),
      },
    ],
  },
];

const faqGroups = [...fabricGroups, ...(FOAM_PRODUCTS_LIVE ? foamGroups : []), ...sharedGroups];

export default function FaqPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Frequently Asked Questions
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Everything you need to know before you order.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {faqGroups.map((group) => (
          <Box key={group.category} sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              {group.category}
            </Typography>
            {group.items.map((item) => (
              <Accordion key={item.question} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1.5, borderRadius: '12px !important', overflow: 'hidden', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 'bold' }}>{item.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ))}
      </Container>
    </Box>
  );
}
