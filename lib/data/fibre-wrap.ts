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
import { FibreWrap, FibreWrapInput } from '@/lib/types/fibre-wrap';

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

// Helper to convert Firestore doc to FibreWrap
const docToFibreWrap = (docId: string, data: any): FibreWrap => {
  return {
    id: docId,
    fibreThickness: data.fibreThickness || '',
    value: data.value ?? 0,
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
  };
};

export const getFibreWraps = async (): Promise<FibreWrap[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const wrapsRef = collection(db, 'fibreWrap');
    const q = query(wrapsRef, orderBy('fibreThickness', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => docToFibreWrap(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching fibre wraps:', error);
    // If orderBy fails, try without it
    try {
      const wrapsRef = collection(db, 'fibreWrap');
      const snapshot = await getDocs(wrapsRef);
      const results = snapshot.docs.map((doc) => docToFibreWrap(doc.id, doc.data()));
      return results.sort((a, b) => a.fibreThickness.localeCompare(b.fibreThickness));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
  }
};

export const getFibreWrap = async (id: string): Promise<FibreWrap | null> => {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const wrapRef = doc(db, 'fibreWrap', id);
    const wrapSnap = await getDoc(wrapRef);
    if (wrapSnap.exists()) {
      return docToFibreWrap(wrapSnap.id, wrapSnap.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching fibre wrap:', error);
    return null;
  }
};

export const createFibreWrap = async (input: FibreWrapInput): Promise<FibreWrap> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const wrapsRef = collection(db, 'fibreWrap');
    const docRef = await addDoc(wrapsRef, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFibreWrap(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating fibre wrap:', error);
    throw error;
  }
};

export const updateFibreWrap = async (
  id: string,
  input: Partial<FibreWrapInput>
): Promise<FibreWrap> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const wrapRef = doc(db, 'fibreWrap', id);
    await updateDoc(wrapRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(wrapRef);
    return docToFibreWrap(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating fibre wrap:', error);
    throw error;
  }
};

export const deleteFibreWrap = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const wrapRef = doc(db, 'fibreWrap', id);
    await deleteDoc(wrapRef);
  } catch (error) {
    console.error('Error deleting fibre wrap:', error);
    throw error;
  }
};
