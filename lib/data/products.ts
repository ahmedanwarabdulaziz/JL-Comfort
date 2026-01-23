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
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { Product, ProductInput } from '@/lib/types/product';

// Mock data fallback
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Sample Product 1',
    description: 'This is a sample product description for testing purposes.',
    price: 99.99,
    currency: 'EGP',
    status: 'active',
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Sample Product 2',
    description: 'Another sample product with a longer description that might be truncated in the UI.',
    price: 149.99,
    currency: 'EGP',
    status: 'active',
    imageUrl: null,
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

// Helper to convert Firestore doc to Product
const docToProduct = (docId: string, data: any): Product => {
  return {
    id: docId,
    name: data.name || '',
    description: data.description || '',
    price: data.price || 0,
    currency: data.currency || 'EGP',
    status: data.status || 'draft',
    imageUrl: data.imageUrl || null,
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
  };
};

export const getProducts = async (): Promise<Product[]> => {
  if (!isFirebaseConfigured() || !db) {
    return mockProducts;
  }

  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map((doc) => docToProduct(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching products:', error);
    return mockProducts;
  }
};

export const getProduct = async (id: string): Promise<Product | null> => {
  if (!isFirebaseConfigured() || !db) {
    return mockProducts.find((p) => p.id === id) || null;
  }

  try {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      return docToProduct(productSnap.id, productSnap.data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const createProduct = async (input: ProductInput): Promise<Product> => {
  if (!isFirebaseConfigured() || !db) {
    const newProduct: Product = {
      id: String(mockProducts.length + 1),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockProducts.push(newProduct);
    return newProduct;
  }

  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToProduct(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  input: Partial<ProductInput>
): Promise<Product> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockProducts[index] = {
        ...mockProducts[index],
        ...input,
        updatedAt: new Date(),
      };
      return mockProducts[index];
    }
    throw new Error('Product not found');
  }

  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(productRef);
    return docToProduct(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    const index = mockProducts.findIndex((p) => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
    }
    return;
  }

  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
