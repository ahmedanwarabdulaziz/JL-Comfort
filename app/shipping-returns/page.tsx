import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Container, Typography, Paper, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { getShippingRate } from '@/lib/data/shippingRates';
import { BUSINESS, FOAM_PRODUCTS_LIVE } from '@/lib/site';
import type { ShippingRate } from '@/lib/types/checkout';

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  alternates: { canonical: '/shipping-returns' },
  description: FOAM_PRODUCTS_LIVE
    ? 'Shipping costs, delivery times and the return policy for upholstery fabric, custom-cut foam and bench cushions shipped across Canada.'
    : 'Shipping costs, delivery times and the return policy for upholstery fabric shipped across Canada.',
};

// Google Merchant Center checks this page against the shipping and return settings entered there, so
// it must say the same as checkout and the Terms (app/terms/page.tsx, "shipping" and "returns").
// Shipping costs are read from the same table checkout uses, so an admin price change shows up here too.
// While only fabric is on sale (FOAM_PRODUCTS_LIVE off), foam and cushions are left out of the wording.

// Turnaround before an order ships; matches the handling time given to Google.
const HANDLING_DAYS = '3–5';

const money = (dollars: number) => `$${dollars.toFixed(2)}`;
const perUnit = (dollars: number, unit: string) => (dollars > 0 ? `${money(dollars)} per ${unit}` : 'Free');

function shippingRows(rate: ShippingRate): { product: string; cost: string }[] {
  const fee = rate.fabricOrderFee > 0 ? `${money(rate.fabricOrderFee)} per order + ` : '';
  return [
    { product: 'Upholstery fabric', cost: rate.fabricPerYard > 0 ? `${fee}${money(rate.fabricPerYard)} per yard` : fee ? `${money(rate.fabricOrderFee)} per order` : 'Free' },
    { product: 'Vinyl & faux leather', cost: rate.vinylPerYard > 0 ? `${fee}${money(rate.vinylPerYard)} per yard` : fee ? `${money(rate.fabricOrderFee)} per order` : 'Free' },
    ...(FOAM_PRODUCTS_LIVE
      ? [
          { product: 'Custom-cut foam', cost: perUnit(rate.foamPerItem, 'piece') },
          { product: 'Bench cushions', cost: perUnit(rate.benchCushionPerItem, 'cushion') },
        ]
      : []),
    { product: 'Fabric samples', cost: 'Free' },
  ];
}

const sectionSx = { fontWeight: 'bold', mb: 2, mt: 5, scrollMarginTop: 96 };
const bodySx = { lineHeight: 1.8, mb: 2 };

export default async function ShippingReturnsPage() {
  const rate = await getShippingRate('CA').catch(() => null);
  const shipping = rate?.enabled ? rate : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Shipping & Returns
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          What to expect after you order {FOAM_PRODUCTS_LIVE ? 'fabric, foam or cushions' : 'fabric'}.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Grid container spacing={4} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <LocalShippingIcon sx={{ fontSize: 36, color: '#b8935f', mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Shipped Across Canada</Typography>
              <Typography variant="body2" color="text.secondary">
                Orders ship within {HANDLING_DAYS} business days
                {shipping ? `, then arrive in about ${shipping.deliveryMinDays}–${shipping.deliveryMaxDays} business days` : ''}.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <AssignmentReturnIcon sx={{ fontSize: 36, color: '#b8935f', mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Made to Order = Final Sale</Typography>
              <Typography variant="body2" color="text.secondary">
                Fabric is cut to your yardage{FOAM_PRODUCTS_LIVE ? ' and foam and cushions to your sizes' : ''}, so we
                can&rsquo;t take returns for a change of mind.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3, textAlign: 'center' }}>
              <ReportProblemIcon sx={{ fontSize: 36, color: '#b8935f', mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Damaged or Wrong? We Fix It</Typography>
              <Typography variant="body2" color="text.secondary">
                Tell us within 14 days of delivery and we&rsquo;ll replace, repair or refund it at no cost to you.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ── Shipping ── */}
        <Typography id="shipping" variant="h5" component="h2" sx={sectionSx}>Shipping</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          We currently ship within Canada only. Every order is cut or made for you, then packed and handed to the
          carrier, usually within {HANDLING_DAYS} business days of payment. Some items, including fabric, may ship
          directly from our supplier.
        </Typography>

        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, mt: 3 }}>Shipping costs</Typography>
        {shipping ? (
          <>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Shipping (CAD)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shippingRows(shipping).map((row) => (
                    <TableRow key={row.product}>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Typography variant="body1" color="text.secondary" sx={bodySx}>
              {shipping.fabricOrderFee > 0 &&
                `The ${money(shipping.fabricOrderFee)} order charge applies once per order, however much fabric and vinyl it includes. `}
              {shipping.freeShippingOver !== null && `Orders over ${money(shipping.freeShippingOver)} ship free. `}
              Your exact shipping cost, and any taxes, are shown at checkout before you pay.
            </Typography>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={bodySx}>
            Shipping is calculated from your order and delivery address and shown at checkout before you pay.
          </Typography>
        )}

        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, mt: 3 }}>Delivery times</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Orders usually ship within {HANDLING_DAYS} business days of payment
          {shipping
            ? ` and are delivered ${shipping.deliveryMinDays}–${shipping.deliveryMaxDays} business days after they ship`
            : ''}
          . These are estimates, not guarantees: carriers and suppliers can occasionally be delayed.
        </Typography>

        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, mt: 3 }}>If your order arrives damaged</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Please keep the packaging and contact us within 14 days of delivery with your order number and photos. We
          will replace or refund the damaged item at no cost to you.
        </Typography>

        {/* ── Returns ── */}
        <Typography id="returns" variant="h5" component="h2" sx={sectionSx}>Returns & Exchanges</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Because every order is cut or made to your specifications &mdash; fabric to the yardage you order
          {FOAM_PRODUCTS_LIVE && ', foam and cushions to the size, grade and options you choose'} &mdash; we cannot accept
          returns or exchanges for a change of mind, including for incorrect measurements or selections you provided.
          Please order a{' '}
          <Box component={Link} href="/fabrics" sx={{ color: '#b8935f' }}>free fabric sample</Box> first, and check our{' '}
          {FOAM_PRODUCTS_LIVE ? (
            <Box component={Link} href="/how-to-measure" sx={{ color: '#b8935f' }}>How to Measure guide</Box>
          ) : (
            <Box component={Link} href="/guides/how-much-fabric-do-i-need" sx={{ color: '#b8935f' }}>yardage guide</Box>
          )}{' '}
          before you order.
        </Typography>

        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, mt: 3 }}>Damaged, defective or wrong orders</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          If your order arrives damaged, is defective, or does not match what you ordered (for example the wrong
          fabric{FOAM_PRODUCTS_LIVE ? ', size, grade or option' : ' or yardage'}), contact us within 14 days of delivery with your order number and photos. We
          will repair or replace the item or give you a full refund, at no cost to you, including return shipping where
          a return is needed.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Normal characteristics of materials are not defects: small variations in fabric colour or texture between
          dye lots{FOAM_PRODUCTS_LIVE && ', foam softening gradually with use or having a mild odour when first unpacked'},
          and wear from normal use, sunlight or improper cleaning.
        </Typography>

        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, mt: 3 }}>Refunds</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Refunds are issued to the original payment method. Your bank or card issuer may take several business days
          to post them.
        </Typography>

        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1, mt: 3 }}>Cancelling an order</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          You can cancel for a full refund until we have started cutting your order or placed it with our supplier.
          Contact us as soon as possible with your order number; once work has begun, the order can no longer be
          cancelled.
        </Typography>

        {/* ── Warranty ── Charlotte's own terms: charlottefabrics.com/lifetime-warranty. Claims go through
            the upholsterer/dealer, which is us, so we file them for the customer. */}
        <Typography id="warranty" variant="h5" component="h2" sx={sectionSx}>Charlotte Lifetime Warranty</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Every Charlotte fabric we sell is backed by Charlotte Fabrics&rsquo; Lifetime Warranty against manufacturing
          and material defects that make the fabric unusable, when it is used for its intended purpose. The warranty
          does not cover misuse, negligence, pet damage or improper cleaning, and labour costs are not guaranteed.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          You don&rsquo;t need to deal with Charlotte yourself: contact us with your order number and photos and we
          will file the claim for you. If Charlotte approves it, you receive replacement fabric of your choice of equal
          or lesser value. Full terms are on{' '}
          <Box component="a" href="https://www.charlottefabrics.com/lifetime-warranty/" target="_blank" rel="noopener noreferrer" sx={{ color: '#b8935f' }}>
            Charlotte&rsquo;s warranty page
          </Box>
          . This is in addition to our 14-day guarantee for damaged, defective or wrong orders above.
        </Typography>

        {/* ── Contact ── */}
        <Typography id="contact" variant="h5" component="h2" sx={sectionSx}>Contact us</Typography>
        <Typography variant="body1" color="text.secondary" sx={bodySx}>
          Email <Box component="a" href={`mailto:${BUSINESS.email}`} sx={{ color: '#b8935f' }}>{BUSINESS.email}</Box> or
          call <Box component="a" href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, '')}`} sx={{ color: '#b8935f' }}>{BUSINESS.phone}</Box>.
          These terms are part of our{' '}
          <Box component={Link} href="/terms" sx={{ color: '#b8935f' }}>Terms of Service</Box>.
        </Typography>
      </Container>
    </Box>
  );
}
