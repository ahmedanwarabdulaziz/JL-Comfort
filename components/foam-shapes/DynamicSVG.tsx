import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { FoamShapeProps } from './RectangleSVG';

interface DynamicSVGProps extends FoamShapeProps {
  svgContent: string;
}

export default function DynamicSVG({ svgContent, dimensions, width = '100%', height = 300 }: DynamicSVGProps) {
  const processedSvg = useMemo(() => {
    let result = svgContent;
    
    // Replace placeholders like {{A}}, {{B}}, etc. with the actual dimension
    // If the dimension is provided (e.g. 24), it replaces {{A}} with '24"'.
    // If not provided, it leaves it as 'A'.
    Object.entries(dimensions).forEach(([letter, value]) => {
      const displayValue = value ? `${value}"` : letter;
      const regex = new RegExp(`\\{\\{${letter}\\}\\}`, 'g');
      result = result.replace(regex, displayValue);
    });

    // Also replace placeholders for letters that weren't in the dimensions object at all
    // to just default to the letter itself.
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(letter => {
      if (!(letter in dimensions)) {
        const regex = new RegExp(`\\{\\{${letter}\\}\\}`, 'g');
        result = result.replace(regex, letter);
      }
    });

    return result;
  }, [svgContent, dimensions]);

  return (
    <Box 
      sx={{ 
        width, 
        height, 
        position: 'relative', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        '& svg': {
          width: '100%',
          height: '100%'
        }
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
}
