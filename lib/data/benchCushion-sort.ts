import { doc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { BenchCushionStyle } from '@/lib/types/benchCushion';

/**
 * Update the sort order of multiple bench cushion styles
 */
export const updateBenchCushionStylesOrder = async (
  styles: BenchCushionStyle[]
): Promise<void> => {
  if (!isFirebaseConfigured() || !db) {
    return;
  }

  try {
    const batch = writeBatch(db!);

    styles.forEach((style, index) => {
      const ref = doc(db!, 'benchCushions', style.id);
      batch.update(ref, { sortOrder: index });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error updating bench cushion styles order:', error);
    throw error;
  }
};
