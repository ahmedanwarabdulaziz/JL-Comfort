import { Timestamp } from 'firebase/firestore';

export interface FoamGrade {
  id: string;
  brand: string; // Main brand name
  gradeName: string; // Grade name
  price: number; // Price (per unit, likely per cubic foot or similar)
  density?: string; // Optional: e.g., "1.8 lb/ft3"
  firmness?: string; // Optional: e.g., "Medium Firm"
  warranty?: string; // Optional: e.g., "10 Years"
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface FoamGradeInput {
  brand: string;
  gradeName: string;
  price: number;
  density?: string;
  firmness?: string;
  warranty?: string;
}
