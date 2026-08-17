import { NextRequest, NextResponse } from 'next/server';

const GITHUB_OWNER = 'ahmedanwarabdulaziz';
const GITHUB_REPO = 'JL-Comfort';
const WORKFLOW_FILE = 'sync-charlotte-fabrics.yml';
const VALID_FACET_GROUPS = ['all', 'color', 'pattern', 'material'];

// Auth is enforced entirely by middleware.ts (matcher covers /api/admin/:path*)
// before this handler ever runs.
export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: 'Server is not configured to trigger syncs (GITHUB_TOKEN missing).' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const facetGroups = VALID_FACET_GROUPS.includes(body?.facetGroups) ? body.facetGroups : 'all';

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main', inputs: { facet_groups: facetGroups } }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('GitHub workflow_dispatch failed:', res.status, text);
      return NextResponse.json({ error: `GitHub API error (${res.status})` }, { status: 502 });
    }

    return NextResponse.json({ triggered: true });
  } catch (error) {
    console.error('Error triggering Charlotte Fabrics sync workflow:', error);
    return NextResponse.json({ error: 'Failed to trigger sync workflow.' }, { status: 500 });
  }
}
