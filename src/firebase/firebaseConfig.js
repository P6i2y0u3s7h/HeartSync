import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Safe debug logging (no secrets or keys logged)
if (typeof window !== 'undefined') {
  console.log("Firebase project initialized:", firebaseConfig.projectId);
}

// Check if credentials have been configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('DummyKey') &&
  !firebaseConfig.apiKey.includes('your_') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('your_project_id')
);

// Single Firebase App initialization instance
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Single Auth instance
export const auth = getAuth(app);

// Single Firestore instance - uses standard getFirestore(app)
export const db = getFirestore(app);

// Single Storage instance
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Runtime configuration verification (Safe: zero secrets or private keys exposed)
if (typeof window !== 'undefined') {
  console.log("Firebase app:", app);
  console.log("FIREBASE PROJECT ID:", app.options.projectId);
  console.log("Firebase Auth Domain:", app.options.authDomain);
  console.log("Firebase Storage Bucket:", app.options.storageBucket);
  console.log("Firestore instance:", db);
  console.log("Firebase config verification:", {
    apiKeyExists: Boolean(firebaseConfig.apiKey),
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderIdExists: Boolean(firebaseConfig.messagingSenderId),
    appIdExists: Boolean(firebaseConfig.appId)
  });
  console.log("navigator.onLine =", navigator.onLine);

  window.addEventListener("online", () => console.log("BROWSER ONLINE"));
  window.addEventListener("offline", () => console.log("BROWSER OFFLINE"));
}

export default app;
