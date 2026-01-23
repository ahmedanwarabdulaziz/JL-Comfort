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
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { FoamGrade, FoamGradeInput } from '@/lib/types/foam-grade';

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

// Helper to convert Firestore doc to FoamGrade
const docToFoamGrade = (docId: string, data: any): FoamGrade => {
  return {
    id: docId,
    brand: data.brand || '',
    gradeName: data.gradeName || '',
    price: data.price ?? 0,
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
  };
};

export const getFoamGrades = async (brand?: string): Promise<FoamGrade[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const gradesRef = collection(db, 'foamGrades');
    let q = query(gradesRef);
    
    if (brand) {
      q = query(gradesRef, where('brand', '==', brand), orderBy('gradeName', 'asc'));
    } else {
      q = query(gradesRef, orderBy('brand', 'asc'), orderBy('gradeName', 'asc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => docToFoamGrade(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching foam grades:', error);
    // If orderBy fails, try without it
    try {
      const gradesRef = collection(db, 'foamGrades');
      let fallbackQuery = query(gradesRef);
      
      if (brand) {
        fallbackQuery = query(gradesRef, where('brand', '==', brand));
      }
      
      const snapshot = await getDocs(fallbackQuery);
      const results = snapshot.docs.map((doc) => docToFoamGrade(doc.id, doc.data()));
      
      // Sort in memory
      if (brand) {
        return results.sort((a, b) => a.gradeName.localeCompare(b.gradeName));
      } else {
        return results.sort((a, b) => {
          const brandCompare = a.brand.localeCompare(b.brand);
          return brandCompare !== 0 ? brandCompare : a.gradeName.localeCompare(b.gradeName);
        });
      }
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
  }
};

export const getFoamGrade = async (id: string): Promise<FoamGrade | null> => {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const gradeRef = doc(db, 'foamGrades', id);
    const gradeSnap = await getDoc(gradeRef);
    if (gradeSnap.exists()) {
      return docToFoamGrade(gradeSnap.id, gradeSnap.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching foam grade:', error);
    return null;
  }
};

export const getFoamGradeBrands = async (): Promise<string[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const gradesRef = collection(db, 'foamGrades');
    const snapshot = await getDocs(gradesRef);
    const brands = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.brand) {
        brands.add(data.brand);
      }
    });
    return Array.from(brands).sort();
  } catch (error) {
    console.error('Error fetching foam grade brands:', error);
    return [];
  }
};

export const createFoamGrade = async (input: FoamGradeInput): Promise<FoamGrade> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const gradesRef = collection(db, 'foamGrades');
    const docRef = await addDoc(gradesRef, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToFoamGrade(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating foam grade:', error);
    throw error;
  }
};

export const updateFoamGrade = async (
  id: string,
  input: Partial<FoamGradeInput>
): Promise<FoamGrade> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const gradeRef = doc(db, 'foamGrades', id);
    await updateDoc(gradeRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(gradeRef);
    return docToFoamGrade(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating foam grade:', error);
    throw error;
  }
};

export const deleteFoamGrade = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const gradeRef = doc(db, 'foamGrades', id);
    await deleteDoc(gradeRef);
  } catch (error) {
    console.error('Error deleting foam grade:', error);
    throw error;
  }
};
