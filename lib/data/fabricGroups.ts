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
import { FabricGroup, FabricGroupInput } from '@/lib/types/fabricGroup';

// Mock data fallback
const mockFabricGroups: FabricGroup[] = [
  {
    id: '1',
    name: 'Most Selling Fabrics',
    description: 'Our top-performing fabrics across all orders.',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

const docToFabricGroup = (docId: string, data: any): FabricGroup => ({
  id: docId,
  name: data.name || '',
  description: data.description || '',
  sortOrder: data.sortOrder ?? 0,
  createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
});

export const getFabricGroups = async (): Promise<FabricGroup[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [...mockFabricGroups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  try {
    const ref = collection(db, 'fabricGroups');

    try {
      const q = query(ref, orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToFabricGroup(d.id, d.data()));
    } catch (orderByError: any) {
      if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
        const snapshot = await getDocs(ref);
        const results = snapshot.docs.map((d) => docToFabricGroup(d.id, d.data()));
        return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error fetching fabric groups:', error);
    if (error?.code !== 'permission-denied') {
      return [...mockFabricGroups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    return [];
  }
};

export const createFabricGroup = async (input: FabricGroupInput): Promise<FabricGroup> => {
  const existing = await getFabricGroups();
  const maxSortOrder = existing.length > 0 ? Math.max(...existing.map((g) => g.sortOrder || 0)) : -1;

  if (!isFirebaseConfigured() || !db) {
    const newGroup: FabricGroup = {
      id: String(mockFabricGroups.length + 1),
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFabricGroups.push(newGroup);
    return newGroup;
  }

  try {
    const ref = collection(db, 'fabricGroups');
    const docRef = await addDoc(ref, {
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFabricGroup(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating fabric group:', error);
    throw error;
  }
};

export const updateFabricGroup = async (
  id: string,
  input: Partial<FabricGroupInput>
): Promise<FabricGroup> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricGroups.findIndex((g) => g.id === id);
    if (index !== -1) {
      mockFabricGroups[index] = { ...mockFabricGroups[index], ...input, updatedAt: new Date() };
      return mockFabricGroups[index];
    }
    throw new Error('Fabric group not found');
  }

  try {
    const ref = doc(db, 'fabricGroups', id);
    await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
    const updatedDoc = await getDoc(ref);
    return docToFabricGroup(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating fabric group:', error);
    throw error;
  }
};

export const deleteFabricGroup = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricGroups.findIndex((g) => g.id === id);
    if (index !== -1) mockFabricGroups.splice(index, 1);
    return;
  }

  try {
    const ref = doc(db, 'fabricGroups', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting fabric group:', error);
    throw error;
  }
};
