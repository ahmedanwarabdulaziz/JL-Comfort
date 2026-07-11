'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Paper, LinearProgress } from '@mui/material';
import { getFoamGrades } from '@/lib/data/foam-grades';
import { FoamGrade } from '@/lib/types/foam-grade';

const firmnessInfo: Record<string, { position: number; blurb: string; bestFor: string }> = {
  'Medium': {
    position: 25,
    blurb: 'A balanced, everyday feel and our most popular compression — great for standard seat cushions and general upholstery replacement.',
    bestFor: 'Everyday seating, lighter use, and anyone who prefers a softer sit.',
  },
  'Medium Firm': {
    position: 50,
    blurb: 'A step up in support without losing comfort, built for cushions that see daily, heavy use.',
    bestFor: 'Frequently-used sofas and chairs, or seating shared by multiple people.',
  },
  'Firm': {
    position: 75,
    blurb: 'A dense, supportive core that holds its shape under sustained weight — a favourite for firmer seating.',
    bestFor: 'Firmer seating preferences, dining chairs, and pieces that need to hold their shape longer.',
  },
  'XX-Firm': {
    position: 100,
    blurb: 'Our densest compression, reserved for premium seating and mattress cores that demand maximum support.',
    bestFor: 'Mattress cores, heavy-duty commercial seating, and anyone who wants maximum support.',
  },
};

export default function FirmnessGuideClient() {
  const [grades, setGrades] = useState<FoamGrade[]>([]);

  useEffect(() => {
    getFoamGrades()
      .then((data) => setGrades(data || []))
      .catch(() => setGrades([]));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

      <Box sx={{ bgcolor: '#e3c29a', color: '#000', py: { xs: 4, md: 6 }, px: 2, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Choosing Your Firmness
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 'normal', opacity: 0.9 }}>
          A quick guide to our four NeoGel compressions.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 5 }}>
          Firmness comes down to personal preference and how a cushion will be used. As a general rule: the more
          often a seat is used, or the more support it needs to hold its shape over time, the firmer the
          compression you&rsquo;ll want. Here&rsquo;s how our four NeoGel grades compare, from softest to firmest.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {(grades.length > 0 ? grades : Object.keys(firmnessInfo).map((f) => ({ id: f, firmness: f, gradeName: f } as any))).map((grade) => {
            const info = firmnessInfo[grade.firmness || ''] || null;
            if (!info) return null;
            return (
              <Grid item xs={12} key={grade.id}>
                <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {grade.gradeName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{grade.firmness}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={info.position}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 2,
                      bgcolor: 'rgba(0,0,0,0.06)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#e3c29a', borderRadius: 4 },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{info.blurb}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Best for: <Typography component="span" variant="body2" color="text.secondary">{info.bestFor}</Typography>
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Still Not Sure?</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 4 }}>
          If in doubt, Medium Firm is the most versatile all-round choice — it holds up well under regular use
          without feeling overly hard. Pairing any grade with{' '}
          <Box component="a" href="/fibre-wrap" sx={{ color: '#b8935f' }}>fibre wrap</Box> also softens the initial
          feel and rounds out the edges, so it&rsquo;s worth considering alongside your firmness choice.
        </Typography>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: '#000', color: '#fff', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Ready to pick your grade?</Typography>
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
