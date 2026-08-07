'use client';

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import FabricPriceTagsList from './FabricPriceTagsList';
import FabricPriceRangesList from './FabricPriceRangesList';

export default function FabricPricingTabs() {
  const [tab, setTab] = useState<'tags' | 'ranges'>('tags');

  return (
    <Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab value="tags" label="Price Tags" />
        <Tab value="ranges" label="Price Ranges" />
      </Tabs>
      {tab === 'tags' ? <FabricPriceTagsList /> : <FabricPriceRangesList />}
    </Box>
  );
}
