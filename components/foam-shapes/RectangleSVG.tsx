import React from 'react';
import { Box, Typography } from '@mui/material';

export interface FoamShapeProps {
  dimensions: Record<string, number>;
  width?: string | number;
  height?: string | number;
}

export default function RectangleSVG({ dimensions, width = '100%', height = 300 }: FoamShapeProps) {
  // Extract values, default to letter if not set or 0
  const valA = dimensions['A'] ? `${dimensions['A']}"` : 'A';
  const valB = dimensions['B'] ? `${dimensions['B']}"` : 'B';
  const valC = dimensions['C'] ? `${dimensions['C']}"` : 'C';

  return (
    <Box sx={{ width, height, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox="0 0 500 400" style={{ width: '100%', height: '100%' }}>
        {/* Faces */}
        {/* Top Face */}
        <polygon points="150,150 200,100 400,100 350,150" fill="#dcedc8" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        {/* Right Face */}
        <polygon points="350,150 400,100 400,200 350,250" fill="#aed581" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        {/* Front Face */}
        <polygon points="150,150 350,150 350,250 150,250" fill="#c5e1a5" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />

        {/* Dimension Lines and Arrows */}
        {/* Width (B) - Bottom Horizontal */}
        <line x1="150" y1="280" x2="350" y2="280" stroke="#1976d2" strokeWidth="2" markerStart="url(#arrowhead-left)" markerEnd="url(#arrowhead-right)" />
        <text x="250" y="305" textAnchor="middle" fill="#1976d2" fontSize="20" fontWeight="bold">{valB}</text>
        
        {/* Height (C) - Left Vertical */}
        <line x1="120" y1="150" x2="120" y2="250" stroke="#f57c00" strokeWidth="2" markerStart="url(#arrowhead-up)" markerEnd="url(#arrowhead-down)" />
        <text x="100" y="205" textAnchor="middle" fill="#f57c00" fontSize="20" fontWeight="bold">{valC}</text>
        
        {/* Depth (A) - Right Diagonal */}
        <line x1="380" y1="260" x2="430" y2="210" stroke="#388e3c" strokeWidth="2" markerStart="url(#arrowhead-diag-down)" markerEnd="url(#arrowhead-diag-up)" />
        <text x="420" y="245" textAnchor="middle" fill="#388e3c" fontSize="20" fontWeight="bold">{valA}</text>

        {/* Defs for arrowheads */}
        <defs>
          <marker id="arrowhead-right" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
          </marker>
          <marker id="arrowhead-left" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
          </marker>
          
          <marker id="arrowhead-up" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f57c00" />
          </marker>
          <marker id="arrowhead-down" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f57c00" />
          </marker>

          <marker id="arrowhead-diag-up" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#388e3c" />
          </marker>
          <marker id="arrowhead-diag-down" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse">
            <polygon points="0 0, 10 3.5, 0 7" fill="#388e3c" />
          </marker>
        </defs>
      </svg>
    </Box>
  );
}
