import type { Metadata } from 'next';
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import Link from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about measuring, foam grades, fibre wrap, shipping, and returns for custom-cut foam.',
};

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

interface FaqGroup {
  category: string;
  items: FaqItem[];
}

const faqGroups: FaqGroup[] = [
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
  {
    category: 'Shipping & Turnaround',
    items: [
      {
        question: 'How long does an order take?',
        answer:
          'Because every order is cut to your exact dimensions, please allow approximately 3–5 business days to cut and ship your order. Full details are on our Shipping & Returns page.',
      },
      {
        question: 'Do you ship orders?',
        answer: (
          <>
            Yes — see our{' '}
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
        question: 'Can I return custom-cut foam?',
        answer:
          'Because foam is cut specifically to the dimensions you provide, orders are final sale once cut. If your order arrives damaged or doesn’t match what you ordered, contact us right away and we’ll make it right.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Frequently Asked Questions
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Everything you need to know before ordering custom foam.
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
