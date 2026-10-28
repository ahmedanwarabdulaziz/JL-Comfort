import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { BUSINESS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact Us',
  alternates: { canonical: '/contact' },
  description:
    'Contact JL Comfort by email or phone about upholstery fabric, free samples or an order. Based in Milton, Ontario, shipping across Canada.',
};

// Same details as the footer, Privacy Policy and Terms (lib/site.ts BUSINESS), on a page of its own so
// shoppers and ad reviewers can find a contact page by its usual address.
const methods = [
  {
    icon: <EmailIcon sx={{ fontSize: 32 }} />,
    title: 'Email',
    value: BUSINESS.email,
    href: `mailto:${BUSINESS.email}`,
    note: 'The best way to reach us. Include your order number if you have one.',
  },
  {
    icon: <PhoneIcon sx={{ fontSize: 32 }} />,
    title: 'Phone',
    value: BUSINESS.phone,
    href: `tel:${BUSINESS.phone.replace(/[^\d+]/g, '')}`,
    note: 'Call or leave a message and we’ll get back to you.',
  },
  {
    icon: <LocationOnIcon sx={{ fontSize: 32 }} />,
    title: 'Address',
    value: BUSINESS.address,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.address)}`,
    note: 'Online orders only; fabric ships across Canada.',
  },
];

export default function ContactPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Contact Us
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          Questions about a fabric, samples or your order? We&rsquo;re happy to help.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {methods.map((method) => (
            <Grid item xs={12} md={4} key={method.title}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
                <Box sx={{ color: '#b8935f', mb: 1.5 }}>{method.icon}</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{method.title}</Typography>
                <Box
                  component="a"
                  href={method.href}
                  {...(method.title === 'Address' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  sx={{ display: 'block', color: '#b8935f', fontWeight: 600, mb: 1, wordBreak: 'break-word' }}
                >
                  {method.value}
                </Box>
                <Typography variant="body2" color="text.secondary">{method.note}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mt: 5 }}>
          Many answers are already in our <Box component={Link} href="/faq" sx={{ color: '#b8935f' }}>FAQ</Box> and{' '}
          <Box component={Link} href="/shipping-returns" sx={{ color: '#b8935f' }}>Shipping &amp; Returns</Box> page. Not
          sure about a colour? <Box component={Link} href="/free-fabric-samples" sx={{ color: '#b8935f' }}>Order a free
          sample</Box> first.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          JL Comfort is a trade name of {BUSINESS.legalName}.
        </Typography>
      </Container>
    </Box>
  );
}
