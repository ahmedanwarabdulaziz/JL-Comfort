import type { Metadata } from 'next';
import { Box, Container, Typography, Paper, Grid } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'Turnaround time, shipping, and return policy for custom-cut NeoGel foam orders.',
};

export default function ShippingReturnsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Shipping & Returns
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          What to expect after you place an order.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <LocalShippingIcon sx={{ fontSize: 36, color: '#b8935f', mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Turnaround Time</Typography>
              <Typography variant="body2" color="text.secondary">
                Orders are cut to your exact dimensions and typically ship within 3–5 business days of payment.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <AssignmentReturnIcon sx={{ fontSize: 36, color: '#b8935f', mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Custom Cut = Final Sale</Typography>
              <Typography variant="body2" color="text.secondary">
                Because every order is cut to the measurements you provide, we&rsquo;re unable to accept returns for
                correctly-cut orders.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <ReportProblemIcon sx={{ fontSize: 36, color: '#b8935f', mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Defects & Cutting Errors</Typography>
              <Typography variant="body2" color="text.secondary">
                If your order arrives damaged, or doesn’t match the dimensions and grade you ordered, contact us
                and we’ll correct it at no charge.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Shipping</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 4 }}>
          Once your order is cut, it’s packed and shipped from our workshop. Shipping cost and estimated delivery
          time depend on your order size and destination, and are shown before you complete checkout. If you need
          a shipping estimate before ordering, reach out to us using the contact details in the footer.
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Returns & Exchanges</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
          Custom-cut foam can’t be resold, so we’re not able to accept returns or exchanges once an order has been
          cut to your specified dimensions — please double-check your measurements using our{' '}
          <Box component="a" href="/how-to-measure" sx={{ color: '#b8935f' }}>How to Measure guide</Box> before
          submitting your order.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          The one exception: if your foam arrives damaged in transit, or we made a cutting or grade error on our
          end, contact us within a reasonable time of delivery with photos of the issue and we’ll arrange a
          replacement or refund.
        </Typography>
      </Container>
    </Box>
  );
}
