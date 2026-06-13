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
  where,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { FoamType, FoamTypeInput } from '@/lib/types/foam';

// Mock data fallback
const mockFoamTypes: FoamType[] = [
  {
    id: '1',
    categoryId: '3', // Reference to seats category
    name: 'Square',
    description: 'Square seat foam',
    imageUrl: null,
    dimensions: [
      { type: 'width', name: 'width', value: 50, unit: 'inch' },
      { type: 'depth', name: 'depth', value: 50, unit: 'inch' },
      { type: 'thickness', name: 'thickness', value: 10, unit: 'inch' },
    ],
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    categoryId: '3', // Reference to seats category
    name: 'Rectangle',
    description: 'Rectangle seat foam',
    imageUrl: null,
    dimensions: [
      { type: 'width', name: 'width', value: 60, unit: 'inch' },
      { type: 'depth', name: 'depth', value: 80, unit: 'inch' },
      { type: 'thickness', name: 'thickness', value: 10, unit: 'inch' },
    ],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

// Helper to convert Firestore doc to FoamType
const docToFoamType = (docId: string, data: any): FoamType => {
  // Normalize dimensions: convert "length" to "depth" for consistency
  const normalizedDimensions = (data.dimensions || []).map((dim: any) => ({
    ...dim,
    type: dim.type === 'length' ? 'depth' : dim.type,
  }));

  return {
    id: docId,
    categoryId: data.categoryId || '',
    name: data.name || '',
    description: data.description || '',
    imageUrl: data.imageUrl || null,
    svgId: data.svgId || '',
    customSvgContent: data.customSvgContent || '',
    dimensions: normalizedDimensions,
    sortOrder: data.sortOrder ?? 0,
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
  };
};

export const getFoamTypes = async (
  categoryId?: string
): Promise<FoamType[]> => {
  if (!isFirebaseConfigured() || !db) {
    const types = categoryId
      ? mockFoamTypes.filter((f) => f.categoryId === categoryId)
      : mockFoamTypes;
    return types.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  try {
    const foamRef = collection(db, 'foam');
    let q = query(foamRef);
    
    // Try with orderBy first
    try {
      if (categoryId) {
        q = query(foamRef, where('categoryId', '==', categoryId), orderBy('sortOrder', 'asc'));
      } else {
        q = query(foamRef, orderBy('sortOrder', 'asc'));
      }
      
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => docToFoamType(doc.id, doc.data()));
      
      // If we got results, return them (even if empty - means no data in Firestore)
      if (results.length > 0) {
        return results;
      }
      
      // If no results and we have a category filter, try without orderBy
      // (maybe the orderBy is causing issues or documents don't have sortOrder)
      if (categoryId) {
        console.warn('No results with orderBy, trying without orderBy...');
        const fallbackQuery = query(foamRef, where('categoryId', '==', categoryId));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackResults = fallbackSnapshot.docs.map((doc) => docToFoamType(doc.id, doc.data()));
        return fallbackResults.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      } else {
        // For "all", try without orderBy
        console.warn('No results with orderBy, trying without orderBy...');
        const fallbackQuery = query(foamRef);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackResults = fallbackSnapshot.docs.map((doc) => docToFoamType(doc.id, doc.data()));
        return fallbackResults.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
    } catch (orderByError: any) {
      // If orderBy fails (index error), try without it
      if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
        console.warn('Index error detected. Fetching without ordering...');
        let fallbackQuery = query(foamRef);
        
        if (categoryId) {
          fallbackQuery = query(foamRef, where('categoryId', '==', categoryId));
        }
        
        const snapshot = await getDocs(fallbackQuery);
        const results = snapshot.docs.map((doc) => docToFoamType(doc.id, doc.data()));
        
        // Sort in memory
        return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
      throw orderByError; // Re-throw if it's not an index error
    }
  } catch (error: any) {
    console.error('Error fetching foam types:', error);
    
    // Only use mock data if there's a real error (not just empty results)
    // Empty results from Firestore are valid - it means no data exists yet
    if (error?.code !== 'permission-denied') {
      console.warn('Using mock data as fallback due to error');
      const types = categoryId
        ? mockFoamTypes.filter((f) => f.categoryId === categoryId)
        : mockFoamTypes;
      return types.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    
    // If permission denied or other critical error, return empty array
    return [];
  }
};

export const getFoamType = async (id: string): Promise<FoamType | null> => {
  if (!isFirebaseConfigured() || !db) {
    return mockFoamTypes.find((f) => f.id === id) || null;
  }

  try {
    const foamRef = doc(db, 'foam', id);
    const foamSnap = await getDoc(foamRef);
    if (foamSnap.exists()) {
      return docToFoamType(foamSnap.id, foamSnap.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching foam type:', error);
    return null;
  }
};

// This function is deprecated - use getCategories from categories.ts instead
// Keeping for backward compatibility
export const getFoamCategories = async (): Promise<string[]> => {
  const { getCategories } = await import('./categories');
  const categories = await getCategories();
  return categories.map((c) => c.name);
};

export const createFoamType = async (
  input: FoamTypeInput
): Promise<FoamType> => {
  // Get current max sortOrder to set new item at the end
  const existingTypes = await getFoamTypes(input.categoryId);
  const maxSortOrder = existingTypes.length > 0
    ? Math.max(...existingTypes.map(t => t.sortOrder || 0))
    : -1;

  if (!isFirebaseConfigured() || !db) {
    const newFoamType: FoamType = {
      id: String(mockFoamTypes.length + 1),
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFoamTypes.push(newFoamType);
    return newFoamType;
  }

  try {
    const foamRef = collection(db, 'foam');
    const docRef = await addDoc(foamRef, {
      ...input,
      sortOrder: input.sortOrder ?? maxSortOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFoamType(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating foam type:', error);
    throw error;
  }
};

export const updateFoamType = async (
  id: string,
  input: Partial<FoamTypeInput>
): Promise<FoamType> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFoamTypes.findIndex((f) => f.id === id);
    if (index !== -1) {
      mockFoamTypes[index] = {
        ...mockFoamTypes[index],
        ...input,
        updatedAt: new Date(),
      };
      return mockFoamTypes[index];
    }
    throw new Error('Foam type not found');
  }

  try {
    const foamRef = doc(db, 'foam', id);
    await updateDoc(foamRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(foamRef);
    return docToFoamType(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating foam type:', error);
    throw error;
  }
};

export const deleteFoamType = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockFoamTypes.findIndex((f) => f.id === id);
    if (index !== -1) {
      mockFoamTypes.splice(index, 1);
    }
    return;
  }

  try {
    const foamRef = doc(db, 'foam', id);
    await deleteDoc(foamRef);
  } catch (error) {
    console.error('Error deleting foam type:', error);
    throw error;
  }
};
