import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIvmIUMI_q8M7pKztCMATKKYOqM2p-o1Y",
  authDomain: "kbu-genclik-projesi.firebaseapp.com",
  projectId: "kbu-genclik-projesi",
  storageBucket: "kbu-genclik-projesi.firebasestorage.app",
  messagingSenderId: "607267008371",
  appId: "1:607267008371:web:b260054d0e61c9d1a55f06",
  measurementId: "G-941FV1GBQC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);