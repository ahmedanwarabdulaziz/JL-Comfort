import { NextResponse } from 'next/server';

// The AI features (fabric visualizer, AI shopping assistant) are built but not launched: their pages
// and APIs are switched off so nobody can reach them or run up AI provider bills. Flip this to true
// to bring them all back.
export const AI_FEATURES_ENABLED = false;

// Returned by every AI API route while the features are off -- a plain 404, as if the route didn't exist.
export function aiFeaturesOffResponse() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
