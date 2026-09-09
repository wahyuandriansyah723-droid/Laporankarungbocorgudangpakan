import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';

const cfg = (appletConfig || {}) as Record<string, any>;

// Configuration read safely from Vite environment variables or firebase-applet-config.json
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || cfg.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || cfg.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || cfg.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || cfg.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || cfg.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || cfg.appId || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || cfg.databaseURL || '',
};

export const firestoreDatabaseId = cfg.firestoreDatabaseId || '(default)';

// Check if Firebase credentials are fully configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Enable offline persistence with multi-tab support to save reads & support real-time sync across devices
    try {
      db = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        firestoreDatabaseId !== '(default)' ? firestoreDatabaseId : undefined
      );
    } catch {
      // Fallback if already initialized
      db = getFirestore(app, firestoreDatabaseId !== '(default)' ? firestoreDatabaseId : undefined);
    }

    auth = getAuth(app);
    // Sign in anonymously to establish auth session if enabled
    signInAnonymously(auth).catch(() => {
      // If anonymous auth is not enabled in Firebase Console, requests proceed as unauthenticated
    });
  } catch (err) {
    console.warn('[Firebase] Initialization error (falling back to offline cache):', err);
  }
} else {
  console.info('[Firebase] Config is empty or not yet set. Operating in Offline / Local Cache Mode.');
}

export { app, db, auth };
