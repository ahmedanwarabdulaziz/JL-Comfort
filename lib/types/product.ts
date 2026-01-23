import { Timestamp } from 'firebase/firestore';

export type ProductStatus = 'draft' | 'active';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  status: ProductStatus;
  imageUrl: string | null;
}
