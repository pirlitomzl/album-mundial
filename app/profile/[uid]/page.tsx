"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { stickers } from "@/lib/stickers";

export default function FriendProfile() {

  const { uid } = useParams();

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {

    const loadUser = async () => {

      const ref = doc(db, "users", uid as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserData(snap.data());
      }

    };

    if (uid) {
      loadUser();
    }

  }, [uid]);

  if (!userData) {

    return (
      <div className="p-6 text-white bg-black min-h-screen flex items-center justify-center">
        Cargando perfil...
      </div>
    );

  }

  const coleccion = userData.stickers || {};

  const inventory = stickers.map((s: any) => ({
    numero: s.numero,
    nombre: s.nombre,
    pais: s.pais,
    cantidad: coleccion[s.numero] || 0,
  }));

  const tiene = inventory.filter((s) => s.cantidad >= 1);
const repetidos = inventory
  .filter((s) => s.cantidad > 1)
  .map((s) => ({
    ...s,
    cantidad: s.cantidad - 1,
  }));  const faltantes = inventory.filter((s) => s.cantidad === 0);

  const total = stickers.length;
  const uniqueOwned = tiene.length;

  const percent = Math.round((uniqueOwned / total) * 100);

  return (

    <div className="p-6 bg-black text-white min-h-screen">

      {/* BOTÓN REGRESAR */}
      <Link
        href="/"
        className="
          inline-flex
          items-center
          gap-2
          mb-6
          px-5
          py-3
          rounded-2xl
          bg-white/10
          border border-white/10
          backdrop-blur-xl
          hover:bg-white/20
          transition
        "
      >
        ← Regresar
      </Link>

      {/* HEADER */}
      <div className="
        bg-white/10
        backdrop-blur-xl
        border border-white/10
        rounded-3xl
        p-6
        mb-8
        shadow-2xl
      ">

        <h1 className="
          text-4xl
          font-bold
          mb-2
          bg-gradient-to-r
          from-yellow-400
          to-yellow-600
          bg-clip-text
          text-transparent
        ">
          👤 Coleccionista
        </h1>

        <p className="text-gray-400 break-all text-sm">
          {uid}
        </p>

        <div className="mt-6">

          <div className="flex justify-between mb-2">

            <span className="text-gray-300">
              Progreso del álbum
            </span>


          </div>

          {/* BARRA PREMIUM */}
          <div className="
            w-full
            h-5
            bg-black/40
            rounded-full
            overflow-hidden
            border border-white/10
            relative
          ">

            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-green-400
                via-emerald-400
                to-green-500
                shadow-[0_0_20px_rgba(34,197,94,0.7)]
                transition-all
                duration-500
              "
              style={{
                width: `${Math.min(Math.max(percent, 0), 100)}%`,
              }}
            />

            <div className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              text-xs
              font-bold
              text-white
            ">
              {percent}%
            </div>

          </div>

          <p className="text-sm text-gray-400 mt-3">
            {uniqueOwned} / {total} estampas
          </p>

        </div>

      </div>

      {/* TIENE */}
      <div className="mb-10">

        <h2 className="text-2xl font-bold text-green-400 mb-4">
          ✅ Tiene
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {tiene.map((s) => (

            <div
              key={s.numero}
              className="
                bg-green-500/10
                border border-green-500/20
                rounded-2xl
                p-4
                hover:scale-[1.02]
                transition
              "
            >

              <p className="font-bold text-yellow-400">
                {s.numero}
              </p>

              <p>{s.nombre}</p>

              <p className="text-sm text-gray-400 mt-2">
                x{s.cantidad}
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* REPETIDOS */}
      <div className="mb-10">

        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          🔁 Repetidos
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {repetidos.map((s) => (

            <div
              key={s.numero}
              className="
                bg-yellow-500/10
                border border-yellow-500/20
                rounded-2xl
                p-4
                hover:scale-[1.02]
                transition
              "
            >

              <p className="font-bold text-yellow-400">
                {s.numero}
              </p>

              <p>{s.nombre}</p>

              <p className="text-sm text-gray-400 mt-2">
                x{s.cantidad}
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* FALTANTES */}
      <div>

        <h2 className="text-2xl font-bold text-red-400 mb-4">
          ❌ Faltantes
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {faltantes.map((s) => (

            <div
              key={s.numero}
              className="
                bg-red-500/10
                border border-red-500/20
                rounded-2xl
                p-4
                hover:scale-[1.02]
                transition
              "
            >

              <p className="font-bold text-yellow-400">
                {s.numero}
              </p>

              <p>{s.nombre}</p>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}