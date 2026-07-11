import type { Metadata } from 'next';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import Link from 'next/link';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'JL Comfort cuts custom foam to your exact dimensions using premium NeoGel High-Density foam.',
};

const pillars = [
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
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          About JL Comfort
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Custom-cut comfort, made simple.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3, color: 'text.secondary' }}>
          JL Comfort exists to solve one specific problem: finding replacement or custom foam that actually fits.
          Off-the-shelf cushion foam almost never matches the piece you’re working on, so we built an ordering
          system that cuts every order to your exact thickness, depth, and width — no compromise sizes, no
          trimming required on your end.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 6, color: 'text.secondary' }}>
          We keep our foam lineup focused on NeoGel, a high-density polyurethane foam available in four
          compressions, so you can spend your time picking the right firmness instead of comparing dozens of
          unfamiliar grades. Pair it with fibre wrap for a rounder, fuller finish, and you have everything needed
          to bring a cushion back to life.
        </Typography>

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

        <Paper elevation={0} sx={{ p: 3, mb: 6, borderRadius: 3, border: '1px dashed', borderColor: '#b8935f' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Quality & Materials</Typography>
          <Typography variant="body2" color="text.secondary">
            [Add any relevant foam certifications here — e.g. CertiPUR-US®, GOLS — once confirmed with our foam
            supplier. Placeholder pending verification.]
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: '#000', color: '#fff', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Ready to measure your cushion?</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Our foam wizard walks you through it in two easy steps.
          </Typography>
          <Typography
            component={Link}
            href="/foam"
            sx={{ color: '#e3c29a', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Start Your Order &rarr;
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
