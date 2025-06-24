// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase config (from your console)
const firebaseConfig = {
  apiKey: "AIzaSyBC25icBwLR_AnCcXUWEwuZ4LUFsz2_Xig",
  authDomain: "edu-desk-79856.firebaseapp.com",
  projectId: "edu-desk-79856",
  storageBucket: "edu-desk-79856.firebasestorage.app",
  messagingSenderId: "990450297149",
  appId: "1:990450297149:web:9d21f00e97649b494a7d54",
  measurementId: "G-H691FJPD99"
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firestore (for database)
const db = getFirestore(app);

// ✅ Export db to use in other files
export { db };
