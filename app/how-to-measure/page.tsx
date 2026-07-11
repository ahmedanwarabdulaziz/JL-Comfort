import type { Metadata } from 'next';
import { Box, Container, Typography, Grid, Paper, Chip } from '@mui/material';

export const metadata: Metadata = {
  title: 'How to Measure',
  description: 'Step-by-step guide to measuring thickness, depth, and width for a custom foam order.',
};

const steps = [
  {
    letter: 'A',
    title: 'Thickness',
    text: 'Measure straight up through the middle of the cushion, from the bottom to the top. Thickness is cut in whole inches, between 1" and 7".',
  },
  {
    letter: 'B',
    title: 'Depth',
    text: 'Measure front-to-back — from the front edge of the cushion to the back. We round this up to our nearest standard foam block size, so your cushion always has enough material to work with.',
  },
  {
    letter: 'C',
    title: 'Width',
    text: 'Measure side-to-side across the cushion. Widths up to 160" are supported; anything over 81" is expertly seamed from two blocks and glued into one piece.',
  },
];

export default function HowToMeasurePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          How to Measure Your Foam
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Three measurements, taken correctly, are all it takes.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Diagram */}
        <Paper elevation={0} sx={{ p: 4, mb: 5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 320 220" width="100%" style={{ maxWidth: 400 }}>
            {/* cushion block, simple isometric-ish rectangle */}
            <polygon points="60,60 220,60 260,90 100,90" fill="#f3e3cf" stroke="#000" strokeWidth="2" />
            <polygon points="60,60 100,90 100,170 60,140" fill="#e3c29a" stroke="#000" strokeWidth="2" />
            <polygon points="100,90 260,90 260,170 100,170" fill="#fdf6ec" stroke="#000" strokeWidth="2" />

            {/* Thickness (A) - vertical on left face */}
            <line x1="45" y1="60" x2="45" y2="140" stroke="#000" strokeWidth="1.5" />
            <text x="30" y="104" fontSize="14" fontWeight="bold">A</text>

            {/* Depth (B) - along the top-left slanted edge */}
            <line x1="55" y1="52" x2="95" y2="82" stroke="#000" strokeWidth="1.5" />
            <text x="60" y="70" fontSize="14" fontWeight="bold">B</text>

            {/* Width (C) - bottom front edge */}
            <line x1="100" y1="182" x2="260" y2="182" stroke="#000" strokeWidth="1.5" />
            <text x="175" y="200" fontSize="14" fontWeight="bold">C</text>
          </svg>
        </Paper>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {steps.map((step) => (
            <Grid item xs={12} md={4} key={step.letter}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Chip
                  label={step.letter}
                  size="small"
                  sx={{ bgcolor: '#000', color: '#e3c29a', fontWeight: 'bold', mb: 1.5 }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary">{step.text}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Tips for an Accurate Cut</Typography>
        <Box component="ul" sx={{ color: 'text.secondary', lineHeight: 1.9, pl: 3, mb: 4 }}>
          <li>Measure your existing foam or the cavity it sits in — whichever gives you the most accurate real-world fit.</li>
          <li>Use a tape measure, not a flexible cloth ruler, for consistent readings.</li>
          <li>If a cushion tapers or isn&rsquo;t perfectly square, measure at the largest point of each dimension so the finished piece isn&rsquo;t undersized.</li>
          <li>Not sure which shape category to pick? Start your order and browse the shape gallery — most common cushion profiles are covered.</li>
        </Box>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: '#000', color: '#fff', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Got your measurements?</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Head to the order wizard and enter them directly — it&rsquo;ll flag anything outside our size limits.
          </Typography>
          <Box
            component="a"
            href="/foam"
            sx={{ color: '#e3c29a', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Start Your Order &rarr;
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
