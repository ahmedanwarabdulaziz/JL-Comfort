import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import {
  CharlotteFabric,
  CharlotteFabricFilters,
  CharlotteFabricsSyncRun,
} from '@/lib/types/charlotteFabric';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

const docToCharlotteFabric = (docId: string, data: any): CharlotteFabric => ({
  id: docId,
  name: data.name || '',
  sku: data.sku || '',
  productUrl: data.productUrl || '',
  imageUrl: data.imageUrl || '',
  imageOk: data.imageOk ?? true,
  color: data.color || [],
  pattern: data.pattern || [],
  material: data.material || [],
  applications: data.applications || [],
  markets: data.markets || [],
  fiberContent: data.fiberContent || '',
  durability: data.durability || '',
  width: data.width || '',
  repeat: data.repeat || '',
  patternDirection: data.patternDirection || '',
  cleanability: data.cleanability || '',
  flammability: data.flammability || '',
  origin: data.origin || '',
  features: data.features || '',
  performance: data.performance || '',
  specs: data.specs || {},
  availability: data.availability || 'InStock',
  status: data.status || 'active',
  firstSeenAt: convertTimestamp(data.firstSeenAt),
  lastSeenAt: convertTimestamp(data.lastSeenAt),
  lastCheckedAt: convertTimestamp(data.lastCheckedAt),
});

/** Fetches every active Charlotte Fabrics catalog item. Filtering happens client-side via filterFabrics(). */
export const getCharlotteFabrics = async (): Promise<CharlotteFabric[]> => {
  if (!isFirebaseConfigured() || !db) {
    return [];
  }

  try {
    const ref = collection(db, 'charlotteFabrics');
    const q = query(ref, where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToCharlotteFabric(d.id, d.data()));
  } catch (error) {
    console.error('Error fetching Charlotte Fabrics catalog:', error);
    return [];
  }
};

/** Client-side filtering shared by the gallery and the admin catalog table. */
export const filterFabrics = (
  fabrics: CharlotteFabric[],
  filters: CharlotteFabricFilters
): CharlotteFabric[] => {
  const search = filters.search?.trim().toLowerCase();

  return fabrics.filter((fabric) => {
    if (filters.color && !fabric.color.includes(filters.color)) return false;
    if (filters.pattern && !fabric.pattern.includes(filters.pattern)) return false;
    if (filters.material && !fabric.material.includes(filters.material)) return false;
    if (filters.application && !fabric.applications.includes(filters.application)) return false;
    if (filters.market && !fabric.markets.includes(filters.market)) return false;
    if (search) {
      const haystack = `${fabric.name} ${fabric.sku}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};

const docToSyncRun = (docId: string, data: any): CharlotteFabricsSyncRun => ({
  id: docId,
  startedAt: convertTimestamp(data.startedAt),
  finishedAt: data.finishedAt ? convertTimestamp(data.finishedAt) : null,
  status: data.status || 'running',
  totals: data.totals || { scanned: 0, added: 0, updated: 0, deactivated: 0, brokenImages: 0, errors: 0 },
  errorLog: data.errorLog || [],
});

/** Fetches the most recent sync run, for the admin status dashboard. */
export const getLatestSyncRun = async (): Promise<CharlotteFabricsSyncRun | null> => {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const ref = collection(db, 'charlotteFabricsSyncRuns');
    const q = query(ref, orderBy('startedAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const first = snapshot.docs[0];
    return docToSyncRun(first.id, first.data());
  } catch (error) {
    console.error('Error fetching latest Charlotte Fabrics sync run:', error);
    return null;
  }
};
