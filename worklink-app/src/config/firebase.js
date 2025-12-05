import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (with error handling)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Analytics initialization skipped:", error.message);
}

export { analytics };

// Set Firebase logging in development
if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}

export default app;
// src/config/firebase.js
export const FIRESTORE_COLLECTIONS = {
  JOBS: `artifacts/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/public/data/jobs`,
  CONTRACTORS: `artifacts/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/public/data/contractors`,
  USERS: `artifacts/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/public/data/users`,
};
