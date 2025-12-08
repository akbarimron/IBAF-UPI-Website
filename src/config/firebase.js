import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjnw1URQv-HhiTxnDhYFMT_fLL5sNT8_0",
  authDomain: "ibaf-upi.firebaseapp.com",
  projectId: "ibaf-upi",
  storageBucket: "ibaf-upi.firebasestorage.app",
  messagingSenderId: "1039987220916",
  appId: "1:1039987220916:web:a3e5052f6b12b536abd2e1",
  measurementId: "G-HVPBK64WRR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

export default app;
