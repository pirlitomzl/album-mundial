"use client";

import { auth, provider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.log("LOGIN ERROR:", err.code, err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <button
        onClick={login}
        className="bg-white text-black px-6 py-3 rounded-xl font-bold"
      >
        Entrar con Google
      </button>
    </div>
  );
}