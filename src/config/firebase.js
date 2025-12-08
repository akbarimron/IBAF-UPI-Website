import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBjnw1URQv-HhiTxnDhYFMT_fLL5sNT8_0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ibaf-upi.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ibaf-upi",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ibaf-upi.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1039987220916",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1039987220916:web:a3e5052f6b12b536abd2e1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HVPBK64WRR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics only if supported (not in SSR)
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Analytics not supported:', err);
  });
}
export { analytics };

export default app;
