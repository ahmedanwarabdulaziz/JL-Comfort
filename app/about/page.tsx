import type { Metadata } from 'next';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import Link from 'next/link';
import { BUSINESS, FOAM_PRODUCTS_LIVE } from '@/lib/site';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export const metadata: Metadata = {
  title: 'About Us',
  alternates: { canonical: '/about' },
  description:
    'JL Comfort sells Charlotte upholstery fabric by the yard across Canada, with free samples and prices in CAD. Based in Milton, Ontario.',
};

const fabricPillars = [
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 32 }} />,
    title: 'The Full Charlotte Range',
    text: 'Thousands of upholstery, drapery and multi-purpose fabrics from Charlotte Fabrics: velvets, chenilles, bouclé, Crypton, outdoor and contract-grade fabrics.',
  },
  {
    icon: <DesignServicesIcon sx={{ fontSize: 32 }} />,
    title: 'Free Samples First',
    text: 'See the colour and feel the texture in your own room before you buy. Samples are free, and we recommend one for every order.',
  },
  {
    icon: <PrecisionManufacturingIcon sx={{ fontSize: 32 }} />,
    title: 'Cut to Your Yardage',
    text: 'Order exactly what your project needs, in 1-yard increments. Every fabric page lists the full specs: width, repeat, double rubs and cleaning code.',
  },
  {
    icon: <VerifiedUserIcon sx={{ fontSize: 32 }} />,
    title: 'Canadian Prices, No Surprises',
    text: 'Every price is in Canadian dollars, and shipping and tax are shown before you pay. If an order arrives damaged or wrong, we make it right.',
  },
];

const foamPillars = [
  {
    icon: <PrecisionManufacturingIcon sx={{ fontSize: 32 }} />,
    title: 'Cut to Your Exact Dimensions',
    text: 'No standard sizes to compromise on. Every order is cut specifically for the piece you’re restoring or building.',
  },
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 32 }} />,
    title: 'Premium NeoGel Foam Only',
    text: 'We stock a single, high-density foam line so every grade you choose from meets the same durability standard.',
  },
  {
    icon: <DesignServicesIcon sx={{ fontSize: 32 }} />,
    title: 'Built for Upholsterers & DIYers',
    text: 'Whether you’re a professional reupholstery shop or restoring a favourite chair at home, our sizing tools are built to make ordering foam simple.',
  },
  {
    icon: <VerifiedUserIcon sx={{ fontSize: 32 }} />,
    title: 'Straightforward, No Surprises',
    text: 'Clear grade options, transparent pricing per cubic foot, and honest guidance on measuring — no guesswork.',
  },
];

export default function AboutPage() {
  const pillars = FOAM_PRODUCTS_LIVE ? [...fabricPillars, ...foamPillars] : fabricPillars;
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          About JL Comfort
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Upholstery fabric by the yard, shipped across Canada.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3, color: 'text.secondary' }}>
          JL Comfort is the online fabric shop of {BUSINESS.legalName}, an upholstery business in Milton, Ontario. We
          know first-hand how hard it is to find good upholstery fabric in Canada: most online fabric stores are in the
          United States, price in US dollars and add cross-border surprises at the door.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: FOAM_PRODUCTS_LIVE ? 3 : 6, color: 'text.secondary' }}>
          So we built the shop we wanted: the{' '}
          <Box component={Link} href="/fabrics" sx={{ color: '#b8935f' }}>Charlotte Fabrics range</Box>, priced in
          Canadian dollars, cut to the yardage you need and shipped across Canada, with free samples so you can be sure
          before you buy. Whether you&rsquo;re a professional upholsterer, a designer or reupholstering a favourite chair
          at home, you get the same fabrics, the same specs and the same help.
        </Typography>
        {FOAM_PRODUCTS_LIVE && (
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 6, color: 'text.secondary' }}>
            We also cut NeoGel high-density foam to your exact dimensions and make bench cushions to order, in the
            fabric you choose.
          </Typography>
        )}

        <Grid container spacing={4} sx={{ mb: 6 }}>
          {pillars.map((item) => (
            <Grid item xs={12} sm={6} key={item.title}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Box sx={{ color: '#b8935f', mb: 1.5 }}>{item.icon}</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">{item.text}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: '#000', color: '#fff', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Ready to find your fabric?</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Browse thousands of fabrics and order free samples before you buy.
          </Typography>
          <Typography
            component={Link}
            href="/fabrics"
            sx={{ color: '#e3c29a', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Shop Fabrics &rarr;
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
