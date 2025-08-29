// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB52LkxYnQXdVHZnes66kIBuq_Mbf5W12E",
  authDomain: "edu-desk-2e693.firebaseapp.com",
  projectId: "edu-desk-2e693",
  storageBucket: "edu-desk-2e693.firebasestorage.app",
  messagingSenderId: "251002738564",
  appId: "1:251002738564:web:32a4ab6e3d624dff402fd1",
  measurementId: "G-NXLX61MS56",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");
googleProvider.setCustomParameters({
  prompt: "select_account", // Forces account selection dialog
});

export default app;
