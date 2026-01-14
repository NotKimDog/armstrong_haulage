import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

export function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  // Initialize Firebase Admin SDK with service account
  // The service account credentials should be set via environment variables
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  return adminApp;
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminDatabase() {
  return getAdminApp().database();
}
