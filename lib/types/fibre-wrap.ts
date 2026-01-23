import { Timestamp } from 'firebase/firestore';

export interface FibreWrap {
  id: string;
  fibreThickness: string; // Thickness value (e.g., "1/2 inch", "1 inch", etc.)
  value: number; // Price or value associated with this thickness
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface FibreWrapInput {
  fibreThickness: string;
  value: number;
}
