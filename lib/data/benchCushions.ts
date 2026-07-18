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
import { BenchCushionStyle, BenchCushionStyleInput } from '@/lib/types/benchCushion';

// Mock data fallback
const mockBenchCushionStyles: BenchCushionStyle[] = [
  {
    id: '1',
    name: 'Rectangular Bench Cushion',
    description: 'Classic rectangular bench cushion, box-edge or knife-edge.',
    images: [],
    dimensions: [
      { type: 'width', name: 'width', value: 48, unit: 'inch' },
      { type: 'depth', name: 'depth', value: 20, unit: 'inch' },
      { type: 'thickness', name: 'thickness', value: 4, unit: 'inch' },
    ],
    variables: [
      {
        name: 'Edge Style',
        options: [
          { label: 'Knife Edge', priceModifier: 0 },
          { label: 'Box Edge', priceModifier: 25 },
        ],
      },
      {
        name: 'Piping',
        options: [
          { label: 'No Piping', priceModifier: 0 },
          { label: 'Matching Piping', priceModifier: 15 },
          { label: 'Contrast Piping', priceModifier: 20 },
        ],
      },
    ],
    basePrice: 120,
    currency: 'usd',
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

const docToBenchCushionStyle = (docId: string, data: any): BenchCushionStyle => ({
  id: docId,
  name: data.name || '',
  description: data.description || '',
  images: data.images || [],
  dimensions: data.dimensions || [],
  variables: data.variables || [],
  basePrice: data.basePrice ?? 0,
  currency: data.currency || 'usd',
  sortOrder: data.sortOrder ?? 0,
  createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
});

export const getBenchCushionStyles = async (): Promise<BenchCushionStyle[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [...mockBenchCushionStyles].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  try {
    const ref = collection(db, 'benchCushions');

    try {
      const q = query(ref, orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToBenchCushionStyle(d.id, d.data()));
    } catch (orderByError: any) {
      if (
        orderByError?.code === 'failed-precondition' ||
        orderByError?.message?.includes('index')
      ) {
        const snapshot = await getDocs(ref);
        const results = snapshot.docs.map((d) => docToBenchCushionStyle(d.id, d.data()));
        return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      throw orderByError;
    }
  } catch (error: any) {
    console.error('Error fetching bench cushion styles:', error);
    if (error?.code !== 'permission-denied') {
      return [...mockBenchCushionStyles].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    return [];
  }
};

export const getBenchCushionStyle = async (id: string): Promise<BenchCushionStyle | null> => {
  if (!isFirebaseConfigured() || !db) {
    return mockBenchCushionStyles.find((s) => s.id === id) || null;
  }

  try {
    const ref = doc(db, 'benchCushions', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return docToBenchCushionStyle(snap.id, snap.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching bench cushion style:', error);
    return null;
  }
};

export const createBenchCushionStyle = async (
  input: BenchCushionStyleInput
): Promise<BenchCushionStyle> => {
  const existing = await getBenchCushionStyles();
  const maxSortOrder = existing.length > 0
    ? Math.max(...existing.map((s) => s.sortOrder || 0))
    : -1;

  if (!isFirebaseConfigured() || !db) {
    const newStyle: BenchCushionStyle = {
      id: String(mockBenchCushionStyles.length + 1),
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockBenchCushionStyles.push(newStyle);
    return newStyle;
  }

  try {
    const ref = collection(db, 'benchCushions');
    const docRef = await addDoc(ref, {
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToBenchCushionStyle(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating bench cushion style:', error);
    throw error;
  }
};

export const updateBenchCushionStyle = async (
  id: string,
  input: Partial<BenchCushionStyleInput>
): Promise<BenchCushionStyle> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockBenchCushionStyles.findIndex((s) => s.id === id);
    if (index !== -1) {
      mockBenchCushionStyles[index] = {
        ...mockBenchCushionStyles[index],
        ...input,
        updatedAt: new Date(),
      };
      return mockBenchCushionStyles[index];
    }
    throw new Error('Bench cushion style not found');
  }

  try {
    const ref = doc(db, 'benchCushions', id);
    await updateDoc(ref, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(ref);
    return docToBenchCushionStyle(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating bench cushion style:', error);
    throw error;
  }
};

export const deleteBenchCushionStyle = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockBenchCushionStyles.findIndex((s) => s.id === id);
    if (index !== -1) {
      mockBenchCushionStyles.splice(index, 1);
    }
    return;
  }

  try {
    const ref = doc(db, 'benchCushions', id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting bench cushion style:', error);
    throw error;
  }
};
