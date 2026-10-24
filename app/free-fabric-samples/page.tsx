import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import JsonLd from '@/components/seo/JsonLd';
import { brand } from '@/lib/brand';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { getSampleSettings } from '@/lib/data/sampleRequests';
import { DEFAULT_SAMPLE_SETTINGS } from '@/lib/types/sampleRequest';

// Landing page for "free fabric samples" searches. The request form itself (/request-samples) is
// kept out of search results; this page explains how it works and sends people to the fabrics.

const url = '/free-fabric-samples';
const title = 'Free Upholstery Fabric Samples in Canada';
const description =
  'Order free upholstery fabric samples, mailed anywhere in Canada at no cost. See the true colour and feel the texture before you buy by the yard.';

export const metadata: Metadata = {
  title: 'Free Upholstery Fabric Samples, Mailed Across Canada',
  description,
  alternates: { canonical: url },
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_CA', title, description, url },
};

// The sample limits are edited in the admin, so read them per request (cached briefly).
export const revalidate = 3600;

const pSx = { color: brand.textSecondary, fontSize: '1rem', lineHeight: 1.8, mb: 2 };
const h2Sx = { fontFamily: 'var(--font-display), serif', fontSize: { xs: '1.45rem', md: '1.75rem' }, color: brand.ink, mt: 6, mb: 1.5 };
const linkSx = { color: brand.accent };

export default async function FreeSamplesPage() {
  const settings = await getSampleSettings().catch(() => DEFAULT_SAMPLE_SETTINGS);

  const steps = [
    { title: 'Find fabrics you like', body: 'Browse the shop, a collection or a Charlotte sample book.' },
    { title: 'Add them to your sample list', body: 'Click “Order free sample” on any fabric page.' },
    { title: 'Send your request', body: `Open your sample list and enter your address. Up to ${settings.maxPerRequest} samples per request.` },
    { title: 'Get them in the mail', body: 'We mail your swatches at no cost and email you a tracking number when they ship.' },
  ];

  const faqs = [
    { q: 'Are fabric samples really free?', a: 'Yes. Samples are free, and we mail them to you at no cost. There is nothing to pay and no payment details to enter.' },
    {
      q: 'How many samples can I order?',
      a: `Up to ${settings.maxPerRequest} samples per request, and up to ${settings.maxPerCustomer} every ${settings.periodDays} days.`,
    },
    { q: 'Do I need to return the samples?', a: 'No. Samples are yours to keep.' },
    { q: 'Do you ship samples outside Canada?', a: 'Not at the moment. We ship samples and orders within Canada.' },
    {
      q: 'Will my order match the sample exactly?',
      a: 'Samples are cut from the current roll. Fabric can vary slightly between dye lots, so order your full yardage at once to keep it all from the same lot.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}${url}`,
        url: `${SITE_URL}${url}`,
        name: title,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      },
    ],
  };

  return (
    <Box sx={{ bgcolor: '#fff', pb: { xs: 8, md: 12 } }}>
      <JsonLd data={structuredData} />

      <Box sx={{ bgcolor: brand.chalk, borderBottom: '1px solid #e5e0d9' }}>
        <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
          <Typography sx={{ color: brand.accent, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1 }}>
            Free samples
          </Typography>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, lineHeight: 1.1, color: brand.ink, mb: 2 }}>
            {title}
          </Typography>
          <Typography sx={{ ...pSx, fontSize: '1.1rem' }}>
            Colour and texture never look quite the same on a screen. Order free swatches of any upholstery fabric in our catalog and
            we&rsquo;ll mail them anywhere in Canada at no cost, so you can see the true colour in your own light before you buy by the yard.
          </Typography>
          {!settings.requestsEnabled && (
            <Typography sx={{ ...pSx, color: brand.accentDeep, fontWeight: 600 }}>
              Sample requests are paused for the moment. You can still browse and add fabrics to your list.
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
            <Box component={Link} href="/sample-books" sx={{ px: 2.5, py: 1.25, bgcolor: brand.ink, color: brand.chalk, textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem', '&:hover': { bgcolor: brand.accent } }}>
              Browse sample books
            </Box>
            <Box component={Link} href="/fabrics" sx={{ px: 2.5, py: 1.25, border: `1px solid ${brand.ink}`, color: brand.ink, textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem', '&:hover': { borderColor: brand.accent, color: brand.accent } }}>
              Shop all fabrics
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md">
        <Typography component="h2" sx={h2Sx}>How it works</Typography>
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
          {steps.map((step, i) => (
            <Box component="li" key={step.title} sx={{ border: '1px solid #e5e0d9', p: 2.5 }}>
              <Typography sx={{ fontFamily: 'var(--font-display), serif', fontStyle: 'italic', color: brand.accent, fontSize: '1.3rem' }}>0{i + 1}</Typography>
              <Typography component="h3" sx={{ fontWeight: 700, color: brand.ink, mt: 0.5, mb: 0.5 }}>{step.title}</Typography>
              <Typography sx={{ color: brand.textSecondary, fontSize: '0.92rem', lineHeight: 1.6 }}>{step.body}</Typography>
            </Box>
          ))}
        </Box>

        <Typography component="h2" sx={h2Sx}>Why order a sample first</Typography>
        <Box component="ul" sx={{ ...pSx, pl: 3, '& li': { mb: 0.75 } }}>
          <li><strong>True colour.</strong> Every screen shows colour differently. See it next to your floors, walls and other furniture.</li>
          <li><strong>Texture and feel.</strong> Feel the hand of a velvet, bouclé or performance weave before committing to yards of it.</li>
          <li><strong>Light.</strong> Check it in daylight and in the evening under lamps: colours shift more than you&rsquo;d expect.</li>
          <li><strong>Cut-to-order fabric is final sale.</strong> Fabric is cut to your yardage, so a sample is the best way to be sure.</li>
        </Box>

        <Typography component="h2" sx={h2Sx}>Where to start</Typography>
        <Typography sx={pSx}>
          Browse <Box component={Link} href="/sample-books" sx={linkSx}>Charlotte sample books</Box>, or start with a popular collection:{' '}
          <Box component={Link} href="/fabrics/performance" sx={linkSx}>performance</Box>,{' '}
          <Box component={Link} href="/fabrics/pet-friendly" sx={linkSx}>pet-friendly</Box>,{' '}
          <Box component={Link} href="/fabrics/velvet" sx={linkSx}>velvet</Box>,{' '}
          <Box component={Link} href="/fabrics/boucle" sx={linkSx}>bouclé</Box> or{' '}
          <Box component={Link} href="/fabrics/outdoor" sx={linkSx}>outdoor</Box>. Not sure what you need? Read{' '}
          <Box component={Link} href="/guides/how-to-choose-upholstery-fabric" sx={linkSx}>how to choose upholstery fabric</Box>.
        </Typography>

        <Typography component="h2" sx={h2Sx}>Common questions</Typography>
        {faqs.map((faq) => (
          <Box key={faq.q} sx={{ mb: 2.5 }}>
            <Typography component="h3" sx={{ fontWeight: 700, color: brand.ink, mb: 0.75 }}>{faq.q}</Typography>
            <Typography sx={{ ...pSx, mb: 0 }}>{faq.a}</Typography>
          </Box>
        ))}
      </Container>
    </Box>
  );
}
