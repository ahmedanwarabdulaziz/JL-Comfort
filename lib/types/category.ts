import { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface CategoryInput {
  name: string;
  description?: string;
}
