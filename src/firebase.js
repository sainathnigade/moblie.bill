import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration parameters.
// Please replace these placeholder values with your actual Firebase project settings
// from the Firebase Console (Project Settings > General > Web Apps).
const firebaseConfig = {
  apiKey: "AIzaSyB16WtGZ5TdCNflLyfeLxJKSjMt6wzkGcQ",
  authDomain: "shree-mobile-90c29.firebaseapp.com",
  projectId: "shree-mobile-90c29",
  storageBucket: "shree-mobile-90c29.firebasestorage.app",
  messagingSenderId: "951306348923",
  appId: "1:951306348923:web:c3da4e4890e0faffa135de",
  measurementId: "G-75YX8NNK4Z"
};

let app;
let auth;
let db;
let isFirebaseConnected = false;

try {
  // If the user has replaced the placeholder API key, attempt real Firebase Initialization
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConnected = true;
  }
} catch (error) {
  console.error("Firebase Initialization failed, falling back to local simulation database:", error);
}

export { auth, db, isFirebaseConnected };
