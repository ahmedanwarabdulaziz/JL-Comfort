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
import { FabricPriceTier, FabricPriceTierInput } from '@/lib/types/fabricPriceTier';

// Mock data fallback
const mockFabricPriceTiers: FabricPriceTier[] = [
  {
    id: '1',
    name: 'Standard',
    pricePerYard: 18,
    materials: ['canvas-denim-twill', 'linen', 'prints', 'woven-patterns', 'boucle', 'embroidery'],
    isDefault: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Performance',
    pricePerYard: 28,
    materials: ['crypton', 'microfiber-microsuede'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Premium',
    pricePerYard: 45,
    materials: ['velvet', 'faux-silk', 'shearling', 'metallic', 'chenille', 'matelasse', 'tapestry', 'faux-wool'],
    sortOrder: 2,
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

const docToFabricPriceTier = (docId: string, data: any): FabricPriceTier => ({
  id: docId,
  name: data.name || '',
  pricePerYard: data.pricePerYard ?? 0,
  materials: data.materials || [],
  isDefault: data.isDefault ?? false,
  sortOrder: data.sortOrder ?? 0,
  createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
});

export const getFabricPriceTiers = async (): Promise<FabricPriceTier[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [...mockFabricPriceTiers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  try {
    const ref = collection(db, 'fabricPriceTiers');

    try {
      const q = query(ref, orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToFabricPriceTier(d.id, d.data()));
    } catch (orderByError: any) {
      if (
        orderByError?.code === 'failed-precondition' ||
        orderByError?.message?.includes('index')
      ) {
        const snapshot = await getDocs(ref);
        const results = snapshot.docs.map((d) => docToFabricPriceTier(d.id, d.data()));
        return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error fetching fabric price tiers:', error);
    if (error?.code !== 'permission-denied') {
      return [...mockFabricPriceTiers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    return [];
  }
};

export const createFabricPriceTier = async (
  input: FabricPriceTierInput
): Promise<FabricPriceTier> => {
  const existing = await getFabricPriceTiers();
  const maxSortOrder = existing.length > 0
    ? Math.max(...existing.map((t) => t.sortOrder || 0))
    : -1;

  if (!isFirebaseConfigured() || !db) {
    const newTier: FabricPriceTier = {
      id: String(mockFabricPriceTiers.length + 1),
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFabricPriceTiers.push(newTier);
    return newTier;
  }

  try {
    const ref = collection(db, 'fabricPriceTiers');
    const docRef = await addDoc(ref, {
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFabricPriceTier(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating fabric price tier:', error);
    throw error;
  }
};

export const updateFabricPriceTier = async (
  id: string,
  input: Partial<FabricPriceTierInput>
): Promise<FabricPriceTier> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricPriceTiers.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockFabricPriceTiers[index] = {
        ...mockFabricPriceTiers[index],
        ...input,
        updatedAt: new Date(),
      };
      return mockFabricPriceTiers[index];
    }
    throw new Error('Fabric price tier not found');
  }

  try {
    const ref = doc(db, 'fabricPriceTiers', id);
    await updateDoc(ref, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(ref);
    return docToFabricPriceTier(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating fabric price tier:', error);
    throw error;
  }
};

export const deleteFabricPriceTier = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFabricPriceTiers.findIndex((t) => t.id === id);
    if (index !== -1) {
      mockFabricPriceTiers.splice(index, 1);
    }
    return;
  }

  try {
    const ref = doc(db, 'fabricPriceTiers', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting fabric price tier:', error);
    throw error;
  }
};
