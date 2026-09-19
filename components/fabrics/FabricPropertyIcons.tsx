import React from 'react';
import { Box, Typography } from '@mui/material';

// Import icons for various properties
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import LocalLaundryServiceOutlinedIcon from '@mui/icons-material/LocalLaundryServiceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import AirOutlinedIcon from '@mui/icons-material/AirOutlined';
import SanitizerOutlinedIcon from '@mui/icons-material/SanitizerOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

import { FabricDetailData } from './FabricDetailClient';

interface PropertyIconDef {
  label: string;
  icon: React.ReactNode;
}

export default function FabricPropertyIcons({ fabric }: { fabric: FabricDetailData }) {
  const icons: PropertyIconDef[] = [];

  // Combine all descriptive fields that might contain keywords
  const allText = [
    fabric.features,
    fabric.performance,
    ...(fabric.properties || []),
    ...(fabric.ecoFriendly || []),
  ].filter(Boolean).join(' ').toLowerCase();

  // Keyword mapping logic
  if (allText.includes('stain')) {
    icons.push({ label: 'Stain Resistant', icon: <WaterDropOutlinedIcon /> });
  }
  if (allText.includes('pet')) {
    icons.push({ label: 'Pet Friendly', icon: <PetsOutlinedIcon /> });
  }
  if (allText.includes('fade')) {
    icons.push({ label: 'Fade Resistant', icon: <WbSunnyOutlinedIcon /> });
  }
  if (allText.includes('washable') || allText.includes('preshrunk')) {
    icons.push({ label: 'Machine Washable', icon: <LocalLaundryServiceOutlinedIcon /> });
  }
  if (allText.includes('crypton')) {
    icons.push({ label: 'Crypton Performance', icon: <ShieldOutlinedIcon /> });
  }
  if (allText.includes('lifeguard')) {
    icons.push({ label: 'Lifeguard Protection', icon: <SecurityOutlinedIcon /> });
  }
  if (allText.includes('eco') || allText.includes('green') || allText.includes('environment')) {
    icons.push({ label: 'Eco Friendly', icon: <SpaOutlinedIcon /> });
  }
  if (allText.includes('odor')) {
    icons.push({ label: 'Odor Resistant', icon: <AirOutlinedIcon /> });
  }
  if (allText.includes('mildew') || allText.includes('bacteria')) {
    icons.push({ label: 'Antimicrobial', icon: <SanitizerOutlinedIcon /> });
  }

  // Handle Country of Origin
  if (fabric.origin) {
    const originLower = fabric.origin.toLowerCase();
    if (originLower.includes('usa') || originLower.includes('united states')) {
      icons.push({ label: 'Made in USA', icon: <FlagOutlinedIcon /> });
    } else {
      icons.push({ label: `Made in ${fabric.origin}`, icon: <PublicOutlinedIcon /> });
    }
  }

  if (icons.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        mb: 4,
        pt: 2,
        pb: 2,
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {icons.map((item, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: 72,
            gap: 1,
            color: '#1a1a1a'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.04)',
              color: '#8A7350',
              '& svg': {
                fontSize: 26,
              }
            }}
          >
            {item.icon}
          </Box>
          <Typography
            variant="caption"
            sx={{
              lineHeight: 1.2,
              fontWeight: 500,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: '#666'
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
