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
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { Category, CategoryInput } from '@/lib/types/category';

// Mock data fallback
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'fibre',
    description: 'Fibre foam category',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'foam rolls',
    description: 'Foam rolls category',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'seats',
    description: 'Seats category',
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

// Helper to convert Firestore doc to Category
const docToCategory = (docId: string, data: any): Category => {
  return {
    id: docId,
    name: data.name || '',
    description: data.description || '',
    sortOrder: data.sortOrder || 0,
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
  };
};

export const getCategories = async (): Promise<Category[]> => {
  if (!isFirebaseConfigured() || !db) {
    return mockCategories;
  }

  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    const categories = snapshot.docs.map((doc) => docToCategory(doc.id, doc.data()));
    
    // Sort locally to avoid needing Firestore composite indexes, and handle missing sortOrder gracefully
    return categories.sort((a, b) => {
      const orderA = a.sortOrder ?? 999;
      const orderB = b.sortOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return mockCategories;
  }
};

export const getCategory = async (id: string): Promise<Category | null> => {
  if (!isFirebaseConfigured() || !db) {
    return mockCategories.find((c) => c.id === id) || null;
  }

  try {
    const categoryRef = doc(db, 'categories', id);
    const categorySnap = await getDoc(categoryRef);
    if (categorySnap.exists()) {
      return docToCategory(categorySnap.id, categorySnap.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

export const createCategory = async (
  input: CategoryInput
): Promise<Category> => {
  if (!isFirebaseConfigured() || !db) {
    const newCategory: Category = {
      id: String(mockCategories.length + 1),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCategories.push(newCategory);
    return newCategory;
  }

  try {
    const categoriesRef = collection(db, 'categories');
    const docRef = await addDoc(categoriesRef, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToCategory(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (
  id: string,
  input: Partial<CategoryInput>
): Promise<Category> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index !== -1) {
      mockCategories[index] = {
        ...mockCategories[index],
        ...input,
        updatedAt: new Date(),
      };
      return mockCategories[index];
    }
    throw new Error('Category not found');
  }

  try {
    const categoryRef = doc(db, 'categories', id);
    await updateDoc(categoryRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(categoryRef);
    return docToCategory(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockCategories.findIndex((c) => c.id === id);
    if (index !== -1) {
      mockCategories.splice(index, 1);
    }
    return;
  }

  try {
    const categoryRef = doc(db, 'categories', id);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const updateCategoriesOrder = async (categories: Category[]): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    // For mock data, just update the in-memory array
    categories.forEach(cat => {
      const index = mockCategories.findIndex(m => m.id === cat.id);
      if (index !== -1) {
        mockCategories[index] = { ...mockCategories[index], sortOrder: cat.sortOrder };
      }
    });
    mockCategories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    return;
  }

  try {
    const batch = writeBatch(db!);
    categories.forEach((cat) => {
      const ref = doc(db!, 'categories', cat.id);
      batch.update(ref, { 
        sortOrder: cat.sortOrder,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error updating categories order:', error);
    throw error;
  }
};
