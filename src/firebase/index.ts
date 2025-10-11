
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// This function ensures that we initialize the app only once.
// It's crucial for preventing errors during hot-reloading in development.
function initializeFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

const firebaseApp: FirebaseApp = initializeFirebaseApp();
const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);

// Export the initialized services as singletons.
export { firebaseApp, auth, firestore };

// Export everything from the provider and other hooks/utilities.
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/mutations';
export * from './errors';
export * from './error-emitter';
// This useUser export was incorrect. The correct one is re-exported from provider.
// export { useUser } from './auth/use-user';
