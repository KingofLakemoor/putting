import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Gracefully handle missing configuration
let app;
try {
  // If API key is missing (e.g. in test or a development environment without .env),
  // initialize with a dummy config to prevent synchronous crashes that break the whole app.
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API key not found. Initializing with dummy configuration.");
    app = initializeApp({
      apiKey: "dummy-api-key",
      authDomain: "dummy-auth-domain",
      projectId: "dummy-project-id",
      storageBucket: "dummy-storage-bucket",
      messagingSenderId: "dummy-messaging-sender-id",
      appId: "dummy-app-id"
    });
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export default app;
