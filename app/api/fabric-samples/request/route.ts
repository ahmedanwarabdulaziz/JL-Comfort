import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { SampleRequestInput, SampleRequestItem } from '@/lib/types/sampleRequest';

const MAX_ITEMS = 5;

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
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: 'Server is not configured (FIREBASE_SERVICE_ACCOUNT missing).' }, { status: 500 });
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
    const docRef = await db.collection('sampleRequests').add({
      items,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      address: {
        line1: address.line1.trim(),
        line2: address.line2?.trim() || '',
        city: address.city.trim(),
        state: address.state.trim(),
        zip: address.zip.trim(),
        country: address.country.trim(),
      },
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Error creating sample request:', error);
    return NextResponse.json({ error: 'Failed to submit sample request.' }, { status: 500 });
  }
}
