import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import JsonLd from '@/components/seo/JsonLd';
import YardageCalculator from '@/components/guides/YardageCalculator';
import { brand } from '@/lib/brand';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { BASE_YARDAGE, wholeYards } from '@/lib/seo/fabricCopy';
import { getGuide, guideHref } from '@/lib/guides';

const guide = getGuide('how-much-fabric-do-i-need')!;
const url = guideHref(guide.slug);

export const metadata: Metadata = {
  title: guide.metaTitle,
  description: guide.description,
  alternates: { canonical: url },
  openGraph: { type: 'article', siteName: SITE_NAME, locale: 'en_CA', title: guide.title, description: guide.description, url },
};

const yards = (min: number, max: number) => {
  const [lo, hi] = [wholeYards(min, 1), wholeYards(max, 1)];
  return lo === hi ? `${lo} yd` : `${lo}–${hi} yd`;
};

const h2Sx = { fontFamily: 'var(--font-display), serif', fontSize: { xs: '1.45rem', md: '1.75rem' }, color: brand.ink, mt: 6, mb: 1.5, scrollMarginTop: 96 };
const h3Sx = { fontSize: '1.05rem', fontWeight: 700, color: brand.ink, mt: 3, mb: 1 };
const pSx = { color: brand.textSecondary, fontSize: '1rem', lineHeight: 1.8, mb: 2 };
const linkSx = { color: brand.accent };
const rowSx = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, py: 1.1, borderBottom: '1px solid #e5e0d9' };

const faqs = [
  {
    q: 'How many yards of fabric do I need for a sofa?',
    a: 'A standard three-seat sofa takes about 14 to 18 yards of 54-inch plain fabric. A loveseat takes 10 to 12 and a sectional 20 to 30. Add 10 to 20 percent for a patterned fabric.',
  },
  {
    q: 'How many yards of fabric do I need for a chair?',
    a: 'About 1 yard for a dining chair seat, 2 yards for a dining chair seat and back, 4 to 6 yards for an accent chair, 6 to 8 for an armchair and 7 to 9 for a wingback.',
  },
  {
    q: 'Should I order extra fabric?',
    a: 'Yes, a little. Order everything for a project at once, since a later order may come from a different dye lot and not match exactly. An extra half yard to a yard also covers repairs and matching pillows.',
  },
  {
    q: 'Why does a pattern need more fabric?',
    a: 'Each cushion and panel has to line up with the pattern, so some fabric between repeats is cut away. The bigger the repeat, the more is lost: allow about 10 percent extra for a 6 to 12 inch repeat and 20 percent for 13 inches or more.',
  },
];

export default function HowMuchFabricGuide() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${SITE_URL}${url}#article`,
        headline: guide.title,
        description: guide.description,
        url: `${SITE_URL}${url}`,
        datePublished: guide.published,
        dateModified: guide.updated,
        inLanguage: 'en-CA',
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
          { '@type': 'ListItem', position: 3, name: guide.title, item: `${SITE_URL}${url}` },
        ],
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

      <Box sx={{ borderBottom: '1px solid #e5e0d9', bgcolor: brand.chalk }}>
        <Container maxWidth="md" sx={{ py: 1.25 }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ fontSize: '0.72rem', color: '#8b857e', display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Box component={Link} href="/" sx={{ color: 'inherit', textDecoration: 'none' }}>Home</Box>›
            <Box component={Link} href="/guides" sx={{ color: 'inherit', textDecoration: 'none' }}>Guides</Box>›
            <span style={{ color: brand.ink }}>{guide.title}</span>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pt: { xs: 4, md: 6 } }}>
        <Typography sx={{ color: brand.accent, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', mb: 1 }}>
          Buying guide
        </Typography>
        <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, lineHeight: 1.1, color: brand.ink, mb: 2 }}>
          {guide.title}
        </Typography>
        <Typography sx={{ ...pSx, fontSize: '1.1rem' }}>
          The short answer: about <strong>1 yard</strong> for a dining chair seat, <strong>6 to 8 yards</strong> for an armchair and{' '}
          <strong>14 to 18 yards</strong> for a three-seat sofa, using standard 54-inch-wide upholstery fabric with no large pattern.
          Below is a chart for the most common pieces, a calculator that adjusts for your fabric, and what changes the amount.
        </Typography>

        {/* ── Chart ── */}
        <Typography id="chart" component="h2" sx={h2Sx}>Upholstery fabric yardage chart</Typography>
        <Typography sx={pSx}>For 54-inch-wide plain fabric or a small pattern. Fabric is sold by the whole yard, so amounts are rounded up.</Typography>
        <Box sx={{ borderTop: '1px solid #e5e0d9', maxWidth: 560, mb: 2 }}>
          <Box sx={{ ...rowSx, py: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b857e' }}>Piece</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b857e' }}>Fabric</Typography>
          </Box>
          {BASE_YARDAGE.map(([item, min, max]) => (
            <Box key={item} sx={rowSx}>
              <Typography sx={{ color: brand.ink }}>{item}</Typography>
              <Typography sx={{ color: brand.ink, fontWeight: 600 }}>{yards(min, max)}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ ...pSx, fontSize: '0.88rem' }}>
          Every fabric page in our shop has this chart worked out for that fabric&rsquo;s own width and pattern repeat, under{' '}
          <em>How much do I need?</em>
        </Typography>

        <YardageCalculator />

        {/* ── What changes it ── */}
        <Typography id="what-changes-it" component="h2" sx={h2Sx}>What changes how much you need</Typography>

        <Typography component="h3" sx={h3Sx}>Fabric width</Typography>
        <Typography sx={pSx}>
          Almost all upholstery fabric is 54 inches wide, and the chart assumes it. A narrower fabric needs more length to cover the same
          furniture; a 48-inch fabric needs roughly an eighth more. Very wide fabrics (110 inches and up) are made for drapery and sheers,
          and are measured by the window instead.
        </Typography>

        <Typography component="h3" sx={h3Sx}>Pattern repeat</Typography>
        <Typography sx={pSx}>
          The repeat is the distance before a pattern starts over. To keep the pattern centred on every cushion and lined up across seams,
          some fabric between repeats is cut away. Allow about <strong>10% extra</strong> for a 6 to 12 inch repeat and{' '}
          <strong>20% extra</strong> for 13 inches or more. Plain fabrics, textures and small patterns need no extra. The vertical repeat
          is listed in the specifications on each fabric page.
        </Typography>

        <Typography component="h3" sx={h3Sx}>Railroaded or up the roll</Typography>
        <Typography sx={pSx}>
          On a <strong>railroaded</strong> fabric the pattern runs across the roll, so a long piece such as a sofa back or a bench cushion
          can be cut in one length without a seam, often using a little less fabric. On fabric that runs <strong>up the roll</strong>, the
          usual direction, pieces wider than 54 inches need a seam, which can add fabric. Each fabric page shows which way it runs.
        </Typography>

        <Typography component="h3" sx={h3Sx}>Style details</Typography>
        <Typography sx={pSx}>
          Skirts, welting (piping), tufting, extra loose cushions and channelled backs all use more fabric. A tight-back sofa with an
          attached seat uses less than one with loose back and seat cushions. If your piece has these, plan toward the top of the range.
        </Typography>

        {/* ── Cushions ── */}
        <Typography id="cushions" component="h2" sx={h2Sx}>Cushions and seats</Typography>
        <Typography sx={pSx}>
          A standard box cushion up to about 24 by 24 inches takes roughly <strong>1 yard</strong> of 54-inch fabric, a little more if it
          is deep or the pattern has to match. Two dining chair seats can often be cut from one yard of plain fabric. For a bench cushion,
          measure the top, the bottom and the sides (the boxing), add about an inch all round for seams, and lay the pieces out on a strip
          54 inches wide to see how many yards they fill.
        </Typography>

        {/* ── Curtains ── */}
        <Typography id="curtains" component="h2" sx={h2Sx}>Curtains and drapery</Typography>
        <Typography sx={pSx}>Curtains are worked out from the window rather than a chart:</Typography>
        <Box component="ol" sx={{ ...pSx, pl: 3 }}>
          <li>Multiply the width of the rod by <strong>2 to 2.5</strong> for fullness.</li>
          <li>Divide by the fabric width and round up: that is how many widths (drops) you need.</li>
          <li>Add about <strong>16 inches</strong> to the finished length for the header and hem: that is the cut length of each drop.</li>
          <li>Multiply the number of drops by the cut length and divide by 36 to get yards. Add one pattern repeat per drop for a patterned fabric.</li>
        </Box>
        <Typography sx={pSx}>
          For example, a 60-inch rod at 2× fullness needs 120 inches of fabric: three widths of 54-inch fabric. At an 84-inch finished
          length, each drop is cut at 100 inches, so 3 × 100 ÷ 36 = 8.3, or <strong>9 yards</strong>. Browse our{' '}
          <Box component={Link} href="/fabrics/drapery" sx={linkSx}>drapery fabrics</Box>.
        </Typography>

        {/* ── Tips ── */}
        <Typography id="tips" component="h2" sx={h2Sx}>Before you order</Typography>
        <Box component="ul" sx={{ ...pSx, pl: 3 }}>
          <li>
            <strong>Order a free sample first.</strong> Check the colour and texture in your own light; screens show both differently.{' '}
            <Box component={Link} href="/sample-books" sx={linkSx}>Browse sample books</Box>.
          </li>
          <li><strong>Order the whole amount at once.</strong> Fabric from a later order can come from a different dye lot and not match exactly.</li>
          <li><strong>Ask your upholsterer.</strong> They will confirm the exact yardage for your piece and style; this guide gets you close.</li>
          <li>
            <strong>Pick the right durability.</strong> For family sofas and dining chairs, look for 30,000 double rubs or more; our{' '}
            <Box component={Link} href="/fabrics/heavy-duty" sx={linkSx}>heavy-duty fabrics</Box> exceed 100,000.
          </li>
        </Box>

        {/* ── FAQ ── */}
        <Typography id="faq" component="h2" sx={h2Sx}>Common questions</Typography>
        {faqs.map((faq) => (
          <Box key={faq.q} sx={{ mb: 2.5 }}>
            <Typography component="h3" sx={{ ...h3Sx, mt: 0 }}>{faq.q}</Typography>
            <Typography sx={{ ...pSx, mb: 0 }}>{faq.a}</Typography>
          </Box>
        ))}

        {/* ── Shop ── */}
        <Box sx={{ mt: 6, p: { xs: 3, md: 4 }, bgcolor: brand.ink, color: brand.chalk }}>
          <Typography sx={{ fontFamily: 'var(--font-display), serif', fontSize: '1.5rem', mb: 1 }}>Ready to choose your fabric?</Typography>
          <Typography sx={{ opacity: 0.8, mb: 2.5 }}>
            Thousands of Charlotte upholstery fabrics by the yard, priced in CAD and shipped across Canada.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {[
              ['All fabrics', '/fabrics'],
              ['Performance', '/fabrics/performance'],
              ['Pet-friendly', '/fabrics/pet-friendly'],
              ['Velvet', '/fabrics/velvet'],
              ['Outdoor', '/fabrics/outdoor'],
            ].map(([label, href]) => (
              <Box key={href} component={Link} href={href} sx={{ px: 2, py: 0.9, border: '1px solid rgba(255,255,255,0.4)', color: brand.chalk, textDecoration: 'none', fontSize: '0.88rem', '&:hover': { borderColor: brand.accent, color: brand.accent } }}>
                {label}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
