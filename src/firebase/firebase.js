// Firebase configuration
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyC0KkyPgbGlDe_EJJ6gNIY5Nhl_ZGFK8eo",
  authDomain: "edudesk-f9dfe.firebaseapp.com",
  projectId: "edudesk-f9dfe",
  storageBucket: "edudesk-f9dfe.firebasestorage.app",
  messagingSenderId: "365152576583",
  appId: "1:365152576583:web:911fe2f409a87f88a37d62",
  measurementId: "G-L1DSYSV3V9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {app , auth , googleProvider}
