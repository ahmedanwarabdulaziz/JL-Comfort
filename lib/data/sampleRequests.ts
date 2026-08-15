import { collection, doc, getDocs, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { SampleRequest } from '@/lib/types/sampleRequest';

const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

const docToSampleRequest = (docId: string, data: any): SampleRequest => ({
  id: docId,
  items: data.items || [],
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || undefined,
  address: data.address || { line1: '', city: '', state: '', zip: '', country: '' },
  status: data.status || 'pending',
  createdAt: convertTimestamp(data.createdAt),
});

/** Reads every sample request — creation only happens server-side via /api/fabric-samples/request. */
export const getSampleRequests = async (): Promise<SampleRequest[]> => {
  if (!isFirebaseConfigured() || !db) return [];
  const q = query(collection(db, 'sampleRequests'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToSampleRequest(d.id, d.data()));
};

export const markSampleRequestShipped = async (id: string): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, 'sampleRequests', id), { status: 'shipped' });
};
