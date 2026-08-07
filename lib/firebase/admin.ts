import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

const getAdminApp = (): App | null => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;

  if (!adminApp) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
  }

  return adminApp;
};

/** Initializes the firebase-admin app from the FIREBASE_SERVICE_ACCOUNT env var. Returns null if unset. */
export const getAdminAuth = (): Auth | null => {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
};

/** Firestore access via the admin SDK — bypasses security rules, for trusted server-side routes only. */
export const getAdminFirestore = (): Firestore | null => {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
};
