import React from 'react';
import RectangleSVG from './RectangleSVG';
import ChairSeatBSVG from './ChairSeatBSVG';
import { FoamShapeProps } from './RectangleSVG';

// Registry of available interactive shapes
export const SVG_SHAPES: Record<string, React.FC<FoamShapeProps>> = {
  'rectangle': RectangleSVG,
  'chair-seat-b': ChairSeatBSVG,
};

export function getShapeComponent(svgId?: string | null): React.FC<FoamShapeProps> | null {
  if (!svgId) return null;
  return SVG_SHAPES[svgId] || null;
}
