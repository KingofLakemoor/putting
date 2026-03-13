import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// In a real app, these would come from environment variables.
// For the purpose of this task, we can use empty strings or placeholders,
// but Firebase requires some configuration to initialize.
// We'll use dummy configuration as we don't have real credentials.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "dummy-project-id.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
