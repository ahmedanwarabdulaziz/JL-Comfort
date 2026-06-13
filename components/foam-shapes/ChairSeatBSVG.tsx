import React from 'react';
import { Box } from '@mui/material';
import { FoamShapeProps } from './RectangleSVG';

export default function ChairSeatBSVG({ dimensions, width = '100%', height = 300 }: FoamShapeProps) {
  // Extract values, default to letter if not set or 0
  const valA = dimensions['A'] ? `${dimensions['A']}"` : 'A';
  const valB = dimensions['B'] ? `${dimensions['B']}"` : 'B';
  const valC = dimensions['C'] ? `${dimensions['C']}"` : 'C';

  return (
    <Box sx={{ width, height, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg viewBox="0 0 550 400" style={{ width: '100%', height: '100%' }}>
        {/* Faces */}
        
        {/* Top Faces */}
        <polygon points="100,220 180,220 220,190 140,190" fill="#dcedc8" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="180,120 320,120 360,90 220,90" fill="#dcedc8" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="320,220 400,220 440,190 360,190" fill="#dcedc8" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        
        {/* Right Side Faces */}
        <polygon points="400,250 440,220 440,190 400,220" fill="#aed581" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="320,220 360,190 360,90 320,120" fill="#aed581" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />
        
        {/* Front Face */}
        <polygon points="100,250 400,250 400,220 320,220 320,120 180,120 180,220 100,220" fill="#c5e1a5" stroke="#7cb342" strokeWidth="2" strokeLinejoin="round" />

        {/* Dimension Lines and Arrows */}
        
        {/* Width (B) - Bottom Horizontal */}
        <line x1="100" y1="290" x2="400" y2="290" stroke="#1976d2" strokeWidth="2" markerStart="url(#arrowhead-left)" markerEnd="url(#arrowhead-right)" />
        <text x="250" y="315" textAnchor="middle" fill="#1976d2" fontSize="20" fontWeight="bold">{valB}</text>
        
        {/* Height (C) - Left Vertical */}
        <line x1="60" y1="120" x2="60" y2="250" stroke="#f57c00" strokeWidth="2" markerStart="url(#arrowhead-up)" markerEnd="url(#arrowhead-down)" />
        <text x="40" y="195" textAnchor="middle" fill="#f57c00" fontSize="20" fontWeight="bold">{valC}</text>
        
        {/* Depth (A) - Right Diagonal */}
        <line x1="420" y1="260" x2="460" y2="230" stroke="#388e3c" strokeWidth="2" markerStart="url(#arrowhead-diag-down)" markerEnd="url(#arrowhead-diag-up)" />
        <text x="460" y="260" textAnchor="middle" fill="#388e3c" fontSize="20" fontWeight="bold">{valA}</text>

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
