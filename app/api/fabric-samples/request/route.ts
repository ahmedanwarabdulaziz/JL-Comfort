import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SampleRequestInput, SampleRequestItem } from '@/lib/types/sampleRequest';

const MAX_ITEMS = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidItem(item: any): item is SampleRequestItem {
  return (
    item &&
    typeof item.fabricId === 'string' &&
    item.fabricId.length > 0 &&
    typeof item.name === 'string' &&
    typeof item.sku === 'string'
  );
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Server is not configured (SUPABASE_SERVICE_ROLE_KEY missing).' },
      { status: 500 }
    );
  }

  let body: SampleRequestInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.filter(isValidItem) : [];
  if (items.length === 0) {
    return NextResponse.json({ error: 'At least one fabric sample is required.' }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ error: `A maximum of ${MAX_ITEMS} samples can be requested at once.` }, { status: 400 });
  }

  const { name, email, phone, address } = body;
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!address?.line1?.trim() || !address?.city?.trim() || !address?.state?.trim() || !address?.zip?.trim() || !address?.country?.trim()) {
    return NextResponse.json({ error: 'A complete shipping address is required.' }, { status: 400 });
  }

  try {
    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('sample_requests')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        address_line1: address.line1.trim(),
        address_line2: address.line2?.trim() || null,
        address_city: address.city.trim(),
        address_state: address.state.trim(),
        address_zip: address.zip.trim(),
        address_country: address.country.trim(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (requestError) throw requestError;

    const itemRows = items.map((item, index) => ({
      sample_request_id: requestRow.id,
      // item.fabricId is the id from getCharlotteFabricsSnapshot(), which is a Postgres uuid
      // post-migration — guard against a stale/malformed value rather than failing the whole request.
      fabric_id: UUID_RE.test(item.fabricId) ? item.fabricId : null,
      name: item.name,
      sku: item.sku,
      image_url: item.imageUrl || '',
      sort_order: index,
    }));

    const { error: itemsError } = await supabaseAdmin.from('sample_request_items').insert(itemRows);
    if (itemsError) throw itemsError;

    return NextResponse.json({ id: requestRow.id });
  } catch (error) {
    console.error('Error creating sample request:', error);
    return NextResponse.json({ error: 'Failed to submit sample request.' }, { status: 500 });
  }
}
