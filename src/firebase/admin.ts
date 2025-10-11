'use server';

import { getApp, getApps, initializeApp, cert, type AppOptions } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let cachedFirestore: Firestore | null = null;
let initAttempted = false;

function parseServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  const unwrapped =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  try {
    const json = unwrapped.startsWith('{') ? unwrapped : Buffer.from(unwrapped, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as Record<string, unknown>;

    const projectId = typeof parsed.project_id === 'string' ? parsed.project_id : (typeof parsed.projectId === 'string' ? parsed.projectId : undefined);
    const clientEmail = typeof parsed.client_email === 'string' ? parsed.client_email : (typeof parsed.clientEmail === 'string' ? parsed.clientEmail : undefined);
    const privateKey = typeof parsed.private_key === 'string' ? parsed.private_key : (typeof parsed.privateKey === 'string' ? parsed.privateKey : undefined);

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Firebase service account JSON is missing required fields.');
      return undefined;
    }

  return { projectId, clientEmail, privateKey } as ServiceAccount;
  } catch (error) {
    console.error('Failed to parse Firebase service account JSON', error);
    return undefined;
  }
}

function initializeAdminApp(): Firestore | null {
  if (cachedFirestore) {
    return cachedFirestore;
  }

  if (initAttempted) {
    return null;
  }
  initAttempted = true;

  try {
    const serviceAccount = parseServiceAccount();
    if (!serviceAccount) {
      console.warn('Firebase Admin SDK not initialized: service account is missing or invalid.');
      return null;
    }

    const projectId = serviceAccount.projectId ?? process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.warn('Firebase Admin SDK not initialized: project ID is missing.');
      return null;
    }

    const options: AppOptions = { credential: cert(serviceAccount), projectId };

    if (!getApps().length) {
      initializeApp(options);
    }

    cachedFirestore = getFirestore(getApp());
    return cachedFirestore;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK', error);
    return null;
  }
}

export async function getAdminFirestore(): Promise<Firestore | null> {
  return initializeAdminApp();
}
