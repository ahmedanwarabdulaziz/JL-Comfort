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
    const q = query(categoriesRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => docToCategory(doc.id, doc.data()));
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
