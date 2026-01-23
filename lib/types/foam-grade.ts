import { Timestamp } from 'firebase/firestore';

export interface FoamGrade {
  id: string;
  brand: string; // Main brand name
  gradeName: string; // Grade name
  price: number; // Price (per unit, likely per cubic foot or similar)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface FoamGradeInput {
  brand: string;
  gradeName: string;
  price: number;
}
