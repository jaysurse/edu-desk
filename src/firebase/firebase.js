// Firebase configuration
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDxhSUBbE0Si5TprCwlm-RPgNMINwuKBf4",
  authDomain: "edu-desk-9f97d.firebaseapp.com",
  projectId: "edu-desk-9f97d",
  storageBucket: "edu-desk-9f97d.firebasestorage.app",
  messagingSenderId: "821521845767",
  appId: "1:821521845767:web:bb6428f38ceba46448e4a2",
  measurementId: "G-NZ9SGXYXLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {app , auth , googleProvider}
