import type { Metadata } from 'next';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const metadata: Metadata = {
  title: 'Fibre Wrap Guide',
  description: 'What Dacron fibre wrap is, its benefits, and when to add it to your custom foam order.',
};

const benefits = [
  'Softens sharp foam edges into a rounded, upholstered look',
  'Fills out your fabric cover so it sits smoothly with fewer wrinkles',
  'Adds a light layer of extra softness on top of the foam’s support',
  'Works with any of our four NeoGel firmness grades',
];

export default function FibreWrapPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Dacron / Fibre Wrap
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          A finishing layer that makes a real difference in the final look and feel.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 4 }}>
          Fibre wrap — often called Dacron — is a soft, non-woven polyester batting that we can wrap around your
          foam core before it ships. It sits between the foam and your fabric cover, and it&rsquo;s one of the easiest
          ways to take a cushion from &ldquo;cut foam&rdquo; to &ldquo;upholstered.&rdquo;
        </Typography>

        <Grid container spacing={2} sx={{ mb: 5 }}>
          {benefits.map((b) => (
            <Grid item xs={12} sm={6} key={b}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <CheckCircleOutlineIcon sx={{ color: '#b8935f', mt: 0.3 }} />
                <Typography variant="body2" color="text.secondary">{b}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Do You Need It?</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
          Fibre wrap is optional. If your fabric cover is thick, tightly upholstered, or you like a firmer, more
          defined edge, you can skip it. If you want a plusher, more rounded finish — closer to what you&rsquo;d see on
          a finished piece of furniture — it&rsquo;s worth adding.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 5 }}>
          You can add fibre wrap as Step 3 of the order wizard, after you&rsquo;ve chosen your foam grade. Pricing is
          calculated per cubic foot, same as the foam itself, and shown live in your order summary.
        </Typography>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: '#000', color: '#fff', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Try it in your order</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Toggle fibre wrap on or off and see the price update instantly.
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
