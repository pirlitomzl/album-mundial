"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function AuthForm({ initialStep = "form" }: { initialStep?: "form" | "verify" }) {
    
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "verify">(initialStep);

  const submit = async () => {
    try {
      setError("");

      if (register) {

        const q = query(collection(db, "users"), where("username", "==", username));
        const existing = await getDocs(q);

        if (!existing.empty) {
          setError("Ese username ya existe");
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", cred.user.uid), {
          username,
          email,
          stickers: {},
          friends: [],
          verified: false,
        });

        await sendEmailVerification(cred.user);

        localStorage.setItem("pendingVerification", "true");
        localStorage.setItem("pendingEmail", email);
        localStorage.setItem("pendingPassword", password);

        await signOut(auth);

        setStep("verify");

        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      await reload(cred.user);

      if (!cred.user.emailVerified) {
        await signOut(auth);
        setError("Debes verificar tu correo primero");
        return;
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  const checkVerification = async () => {
    try {
      const savedEmail = localStorage.getItem("pendingEmail") || email;
      const savedPassword = localStorage.getItem("pendingPassword") || password;
      const cred = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
      await reload(cred.user);

      if (cred.user.emailVerified) {
        await setDoc(doc(db, "users", cred.user.uid), { verified: true }, { merge: true });
        localStorage.removeItem("pendingVerification");
        localStorage.removeItem("pendingEmail");
        localStorage.removeItem("pendingPassword");      
        window.location.reload();
      } else {
        await signOut(auth);
        setError("Aún no has confirmado tu correo. Revisa tu bandeja.");
      }
    } catch (err: any) {
      setError("Ocurrió un error al verificar. Intenta de nuevo.");
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="bg-white/10 p-8 rounded-3xl max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">📩 Te enviamos un correo</h1>
          <p className="text-gray-300 mb-6">
            Revisa tu email y confirma tu cuenta antes de continuar.
          </p>
          <button
            onClick={checkVerification}
            className="w-full p-4 rounded-2xl bg-yellow-500 text-black font-bold hover:scale-[1.02] transition"
          >
            Ya confirmé mi correo
          </button>
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md bg-white/10 p-8 rounded-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center">⚽ Álbum Mundial</h1>

        {register && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-3 rounded-xl bg-black/30"
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-3 rounded-xl bg-black/30"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-3 rounded-xl bg-black/30"
        />

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={submit}
          className="w-full p-3 bg-yellow-500 text-black font-bold rounded-xl"
        >
          {register ? "Crear cuenta" : "Iniciar sesión"}
        </button>

        <button
          onClick={() => setRegister(!register)}
          className="w-full mt-4 text-sm text-gray-400"
        >
          {register ? "Ya tengo cuenta" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
}