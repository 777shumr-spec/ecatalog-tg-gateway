// api/_firebase.js
const admin = require('firebase-admin');

if (!global._firebaseApp) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing FIREBASE_* envs');
    throw new Error('Missing FIREBASE_* envs');
  }
  // відновлюємо \n
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  global._firebaseApp = admin.app();
}

const db = admin.firestore();
module.exports = { admin, db };
