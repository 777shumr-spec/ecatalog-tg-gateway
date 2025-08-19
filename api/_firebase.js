// api/_firebase.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getDb() {
  if (!getApps().length) {
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY,
    } = process.env;

    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}
