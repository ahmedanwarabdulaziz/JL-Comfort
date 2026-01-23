import { updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { FoamType } from '@/lib/types/foam';

/**
 * Update the sort order of multiple foam types
 */
export const updateFoamTypesOrder = async (
  foamTypes: FoamType[]
): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    // For mock data, just update the sortOrder in memory
    return;
  }

  try {
    const batch = writeBatch(db!);
    
    foamTypes.forEach((foamType, index) => {
      const foamRef = doc(db!, 'foam', foamType.id);
      batch.update(foamRef, { sortOrder: index });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating foam types order:', error);
    throw error;
  }
};
