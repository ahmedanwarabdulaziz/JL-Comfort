import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { FabricPriceTag, FabricPriceTagInput } from '@/lib/types/fabricPriceTag';

// Mock data fallback
const mockFabricPriceTags: FabricPriceTag[] = [
  { id: '1', name: 'Economy', pricePerYard: 12, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Standard', pricePerYard: 22, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Premium', pricePerYard: 40, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
];

const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

const docToFabricPriceTag = (docId: string, data: any): FabricPriceTag => ({
  id: docId,
  name: data.name || '',
  pricePerYard: data.pricePerYard ?? 0,
  sortOrder: data.sortOrder ?? 0,
  createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
});

export const getFabricPriceTags = async (): Promise<FabricPriceTag[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [...mockFabricPriceTags].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  try {
    const ref = collection(db, 'fabricPriceTags');

    try {
      const q = query(ref, orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToFabricPriceTag(d.id, d.data()));
    } catch (orderByError: any) {
      if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
        const snapshot = await getDocs(ref);
        const results = snapshot.docs.map((d) => docToFabricPriceTag(d.id, d.data()));
        return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error fetching fabric price tags:', error);
    if (error?.code !== 'permission-denied') {
      return [...mockFabricPriceTags].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    return [];
  }
};

export const createFabricPriceTag = async (input: FabricPriceTagInput): Promise<FabricPriceTag> => {
  const existing = await getFabricPriceTags();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((t) => t.sortOrder || 0)) : -1;

  if (!isFirebaseConfigured() || !db) {
    const newTag: FabricPriceTag = {
      id: String(mockFabricPriceTags.length + 1),
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFabricPriceTags.push(newTag);
    return newTag;
  }

  try {
    const ref = collection(db, 'fabricPriceTags');
    const docRef = await addDoc(ref, {
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFabricPriceTag(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating fabric price tag:', error);
    throw error;
  }
};

export const updateFabricPriceTag = async (
  id: string,
  input: Partial<FabricPriceTagInput>
): Promise<FabricPriceTag> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricPriceTags.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockFabricPriceTags[index] = { ...mockFabricPriceTags[index], ...input, updatedAt: new Date() };
      return mockFabricPriceTags[index];
    }
    throw new Error('Fabric price tag not found');
  }

  try {
    const ref = doc(db, 'fabricPriceTags', id);
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
    const updatedDoc = await getDoc(ref);
    return docToFabricPriceTag(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating fabric price tag:', error);
    throw error;
  }
};

export const deleteFabricPriceTag = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricPriceTags.findIndex((t) => t.id === id);
    if (index !== -1) mockFabricPriceTags.splice(index, 1);
    return;
  }

  try {
    const ref = doc(db, 'fabricPriceTags', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting fabric price tag:', error);
    throw error;
  }
};
