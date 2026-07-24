import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | undefined;

/** Initializes the firebase-admin app from the FIREBASE_SERVICE_ACCOUNT env var. Returns null if unset. */
export const getAdminAuth = (): Auth | null => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;

  if (!adminApp) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
  }

  return getAuth(adminApp);
};
