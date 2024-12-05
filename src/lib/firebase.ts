import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6mdmBqm6Yf_dYlEqJ6qsp-MYH_rxUANs",
  authDomain: "recipes-bolt.firebaseapp.com",
  projectId: "recipes-bolt",
  storageBucket: "recipes-bolt.firebasestorage.app",
  messagingSenderId: "204029629167",
  appId: "1:204029629167:web:26be543933ed9336f2411a",
  measurementId: "G-FT62W6CZDK",
};

const app = initializeApp(firebaseConfig);
export { app };
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();