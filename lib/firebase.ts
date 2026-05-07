import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPzm7adTg3i4BzvLAyzv0JMjoeDIqRi10",
  authDomain: "album-mundial-a5b71.firebaseapp.com",
  projectId: "album-mundial-a5b71",
  storageBucket: "album-mundial-a5b71.firebasestorage.app",
  messagingSenderId: "488323193543",
  appId: "1:488323193543:web:5c6086a375ebf0120b7ce2",
  measurementId: "G-9JY5HG7TR7"
};

const app = initializeApp(firebaseConfig);

// 🔐 AUTH (IMPORTANTE: UNA SOLA INSTANCIA)
export const auth = getAuth(app);

// 👤 GOOGLE PROVIDER (FORZADO)
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

// 🗄️ FIRESTORE
export const db = getFirestore(app);