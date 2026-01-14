import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBjFMr1lRiwcUkXgB9kqsWTpii7OH_YM2c",
  authDomain: "armstrong-haulage.firebaseapp.com",
  databaseURL: "https://armstrong-haulage-default-rtdb.firebaseio.com",
  projectId: "armstrong-haulage",
  // Storage bucket (gs:// URL provided by user)
  storageBucket: "gs://armstrong-haulage.firebasestorage.app",
  messagingSenderId: "293936768104",
  appId: "1:293936768104:web:5c5fb048a052d12a2c07dd",
  measurementId: "G-7HJHDPKP7K"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);

// Export the resolved storage bucket GS URL for use elsewhere
const STORAGE_GS_URL = firebaseConfig.storageBucket as string;

export { app, analytics, auth, STORAGE_GS_URL };
