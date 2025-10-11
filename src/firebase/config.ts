import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';

type FirebaseUiConfig = {
  signInFlow: 'popup' | 'redirect';
  signInOptions: string[];
  callbacks: {
    signInSuccessWithAuthResult: () => boolean;
  };
};

function ensureEnv(value: string | undefined, key: string): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'undefined') {
    throw new Error(`Missing Firebase environment variable: ${key}`);
  }
  return trimmed;
}

// This configuration is now correctly set up to use environment variables
// that Next.js makes available to the client-side code.
export const firebaseConfig: FirebaseOptions = {
  apiKey: ensureEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: ensureEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: ensureEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: ensureEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: ensureEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: ensureEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, 'NEXT_PUBLIC_FIREBASE_APP_ID'),
};

// Initialize Firebase
// We need to check if an app has already been initialized to prevent errors.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export the initialized services
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const uiConfig: FirebaseUiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    EmailAuthProvider.PROVIDER_ID,
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false,
  },
};
