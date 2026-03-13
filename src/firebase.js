import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAARcGids538YyiOqB1WcXh_ZqPuJExVHE",
  authDomain: "putting-63c6c.firebaseapp.com",
  projectId: "putting-63c6c",
  storageBucket: "putting-63c6c.firebasestorage.app",
  messagingSenderId: "868951185666",
  appId: "1:868951185666:web:35d2b37c2f785c91a48a1b",
  measurementId: "G-92N4JG5RY5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
