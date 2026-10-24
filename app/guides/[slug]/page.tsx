import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Box, Container, Typography } from '@mui/material';
import JsonLd from '@/components/seo/JsonLd';
import GuideBody from '@/components/guides/GuideBody';
import { brand } from '@/lib/brand';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { GUIDES, getGuide, guideHref, relatedGuides } from '@/lib/guides';
import { guideFaqs, loadGuide, readingMinutes } from '@/lib/guideContent';
import { getCollection } from '@/lib/collections/definitions';

// One template for every Markdown guide (content/guides/<slug>.md). Built at deploy time.
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.filter((guide) => !guide.custom).map((guide) => ({ slug: guide.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuide(params.slug);
  if (!guide) return {};
  const url = guideHref(guide.slug);
  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', siteName: SITE_NAME, locale: 'en_CA', title: guide.title, description: guide.description, url },
  };
}

const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide || guide.custom) notFound();
  const blocks = loadGuide(guide.slug);
  const faqs = guideFaqs(blocks);
  const contents = blocks.filter((b): b is Extract<typeof b, { type: 'h2' }> => b.type === 'h2');
  const shop = guide.collections.map(getCollection).filter(Boolean).map((c) => c!);
  const related = relatedGuides(guide.slug);
  const pageUrl = `${SITE_URL}${guideHref(guide.slug)}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: guide.title,
        description: guide.description,
        url: pageUrl,
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
          { '@type': 'ListItem', position: 3, name: guide.title, item: pageUrl },
        ],
      },
      ...(faqs.length
        ? [{ '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) }]
        : []),
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
        <Typography component="h1" variant="h1" sx={{ fontSize: { xs: '2.1rem', md: '2.8rem' }, lineHeight: 1.12, color: brand.ink, mb: 1.5 }}>
          {guide.title}
        </Typography>
        <Typography sx={{ color: '#8b857e', fontSize: '0.82rem', mb: 3 }}>
          Updated {formatDate(guide.updated)} · {readingMinutes(blocks)} min read
        </Typography>

        {contents.length > 2 && (
          <Box component="nav" aria-label="In this guide" sx={{ border: '1px solid #e5e0d9', p: 2.5, mb: 2 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b857e', mb: 1 }}>
              In this guide
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5, color: brand.ink, fontSize: '0.92rem', lineHeight: 1.9 }}>
              {contents.map((h) => (
                <li key={h.id}>
                  <Box component="a" href={`#${h.id}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: brand.accent } }}>{h.text}</Box>
                </li>
              ))}
            </Box>
          </Box>
        )}

        <GuideBody blocks={blocks} />

        {shop.length > 0 && (
          <Box sx={{ mt: 6, p: { xs: 3, md: 4 }, bgcolor: brand.ink, color: brand.chalk }}>
            <Typography sx={{ fontFamily: 'var(--font-display), serif', fontSize: '1.5rem', mb: 1 }}>Shop the fabrics in this guide</Typography>
            <Typography sx={{ opacity: 0.8, mb: 2.5 }}>Charlotte upholstery fabric by the yard, priced in CAD, with free samples.</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {shop.map((c) => (
                <Box key={c.slug} component={Link} href={`/fabrics/${c.slug}`} sx={{ px: 2, py: 0.9, border: '1px solid rgba(255,255,255,0.4)', color: brand.chalk, textDecoration: 'none', fontSize: '0.88rem', '&:hover': { borderColor: brand.accent, color: brand.accent } }}>
                  {c.label}
                </Box>
              ))}
              <Box component={Link} href="/sample-books" sx={{ px: 2, py: 0.9, bgcolor: brand.accent, color: '#fff', textDecoration: 'none', fontSize: '0.88rem' }}>
                Order free samples
              </Box>
            </Box>
          </Box>
        )}

        <Typography component="h2" sx={{ fontFamily: 'var(--font-display), serif', fontSize: '1.4rem', color: brand.ink, mt: 6, mb: 2 }}>
          More buying guides
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
          {related.map((g) => (
            <Box key={g.slug} component={Link} href={guideHref(g.slug)} sx={{ display: 'block', p: 2.25, border: '1px solid #e5e0d9', textDecoration: 'none', '&:hover': { borderColor: brand.accent } }}>
              <Typography sx={{ color: brand.ink, fontWeight: 600, lineHeight: 1.35 }}>{g.title}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
