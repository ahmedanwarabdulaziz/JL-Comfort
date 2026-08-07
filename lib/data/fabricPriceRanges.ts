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
import { FabricPriceRange, FabricPriceRangeInput } from '@/lib/types/fabricPriceRange';

export { resolvePriceRange } from '@/lib/types/fabricPriceRange';

// Mock data fallback
const mockFabricPriceRanges: FabricPriceRange[] = [
  { id: '1', name: 'Economy Fabrics', minPrice: 1, maxPrice: 20, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Standard Fabrics', minPrice: 21, maxPrice: 35, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'Premium Fabrics', minPrice: 36, maxPrice: null, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
];

const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

const docToFabricPriceRange = (docId: string, data: any): FabricPriceRange => ({
  id: docId,
  name: data.name || '',
  minPrice: data.minPrice ?? 0,
  maxPrice: data.maxPrice ?? null,
  sortOrder: data.sortOrder ?? 0,
  createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
});

export const getFabricPriceRanges = async (): Promise<FabricPriceRange[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [...mockFabricPriceRanges].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  try {
    const ref = collection(db, 'fabricPriceRanges');

    try {
      const q = query(ref, orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToFabricPriceRange(d.id, d.data()));
    } catch (orderByError: any) {
      if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
        const snapshot = await getDocs(ref);
        const results = snapshot.docs.map((d) => docToFabricPriceRange(d.id, d.data()));
        return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error fetching fabric price ranges:', error);
    if (error?.code !== 'permission-denied') {
      return [...mockFabricPriceRanges].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    return [];
  }
};

export const createFabricPriceRange = async (input: FabricPriceRangeInput): Promise<FabricPriceRange> => {
  const existing = await getFabricPriceRanges();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((r) => r.sortOrder || 0)) : -1;

  if (!isFirebaseConfigured() || !db) {
    const newRange: FabricPriceRange = {
      id: String(mockFabricPriceRanges.length + 1),
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFabricPriceRanges.push(newRange);
    return newRange;
  }

  try {
    const ref = collection(db, 'fabricPriceRanges');
    const docRef = await addDoc(ref, {
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFabricPriceRange(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating fabric price range:', error);
    throw error;
  }
};

export const updateFabricPriceRange = async (
  id: string,
  input: Partial<FabricPriceRangeInput>
): Promise<FabricPriceRange> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricPriceRanges.findIndex((r) => r.id === id);
    if (index !== -1) {
      mockFabricPriceRanges[index] = { ...mockFabricPriceRanges[index], ...input, updatedAt: new Date() };
      return mockFabricPriceRanges[index];
    }
    throw new Error('Fabric price range not found');
  }

  try {
    const ref = doc(db, 'fabricPriceRanges', id);
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
    const updatedDoc = await getDoc(ref);
    return docToFabricPriceRange(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating fabric price range:', error);
    throw error;
  }
};

export const deleteFabricPriceRange = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricPriceRanges.findIndex((r) => r.id === id);
    if (index !== -1) mockFabricPriceRanges.splice(index, 1);
    return;
  }

  try {
    const ref = doc(db, 'fabricPriceRanges', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting fabric price range:', error);
    throw error;
  }
};
