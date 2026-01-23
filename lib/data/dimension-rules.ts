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
  where,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { DimensionRule, DimensionRuleInput, RangeRule } from '@/lib/types/dimension-rules';

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

// Helper to convert Firestore doc to DimensionRule
const docToDimensionRule = (docId: string, data: any): DimensionRule => {
  return {
    id: docId,
    dimensionType: data.dimensionType || 'width',
    allowFractions: data.allowFractions ?? true,
    minValue: data.minValue ?? undefined,
    maxValue: data.maxValue ?? undefined,
    ranges: data.ranges || [],
    createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date(),
  };
};

export const getDimensionRules = async (): Promise<DimensionRule[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const rulesRef = collection(db, 'dimensionRules');
    const q = query(rulesRef, orderBy('dimensionType', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => docToDimensionRule(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching dimension rules:', error);
    return [];
  }
};

export const getDimensionRule = async (
  dimensionType: string
): Promise<DimensionRule | null> => {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const rulesRef = collection(db, 'dimensionRules');
    const q = query(rulesRef, where('dimensionType', '==', dimensionType));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      return docToDimensionRule(snapshot.docs[0].id, snapshot.docs[0].data());
    }
    return null;
  } catch (error) {
    console.error('Error fetching dimension rule:', error);
    return null;
  }
};

export const createDimensionRule = async (
  input: DimensionRuleInput
): Promise<DimensionRule> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const rulesRef = collection(db, 'dimensionRules');
    const docRef = await addDoc(rulesRef, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newDoc = await getDoc(docRef);
    return docToDimensionRule(docRef.id, newDoc.data());
  } catch (error) {
    console.error('Error creating dimension rule:', error);
    throw error;
  }
};

export const updateDimensionRule = async (
  id: string,
  input: Partial<DimensionRuleInput>
): Promise<DimensionRule> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const ruleRef = doc(db, 'dimensionRules', id);
    await updateDoc(ruleRef, {
      ...input,
      updatedAt: serverTimestamp(),
    });
    const updatedDoc = await getDoc(ruleRef);
    return docToDimensionRule(id, updatedDoc.data());
  } catch (error) {
    console.error('Error updating dimension rule:', error);
    throw error;
  }
};

export const deleteDimensionRule = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase not configured');
  }

  try {
    const ruleRef = doc(db, 'dimensionRules', id);
    await deleteDoc(ruleRef);
  } catch (error) {
    console.error('Error deleting dimension rule:', error);
    throw error;
  }
};

// Helper function to calculate the rounded value based on rules
export const calculateRoundedValue = (
  value: number,
  rule: DimensionRule | null
): number => {
  if (!rule) {
    return value; // No rule, return as-is
  }

  // Check min/max constraints
  if (rule.minValue !== undefined && value < rule.minValue) {
    value = rule.minValue;
  }
  if (rule.maxValue !== undefined && value > rule.maxValue) {
    value = rule.maxValue;
  }

  // Round fractions if not allowed
  if (!rule.allowFractions) {
    value = Math.ceil(value); // Round up to nearest whole number
  }

  // Apply range rules
  if (rule.ranges && rule.ranges.length > 0) {
    // Sort ranges by min value
    const sortedRanges = [...rule.ranges].sort((a, b) => a.min - b.min);
    
    for (const range of sortedRanges) {
      const max = range.max ?? Infinity;
      if (value >= range.min && value < max) {
        return range.roundTo;
      }
    }
  }

  return value;
};
