"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function Friends() {
  const [friendUid, setFriendUid] = useState("");
  const [msg, setMsg] = useState("");

  const addFriend = async () => {
    const user = auth.currentUser;
    if (!user || !friendUid) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        friends: arrayUnion(friendUid),
      });

      setMsg("✔ Amigo agregado");
      setFriendUid("");
    } catch {
      setMsg("❌ Error");
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl mt-6">

      <h2 className="font-bold mb-2">👥 Amigos</h2>

      <input
        className="w-full p-2 bg-gray-800 rounded mb-2"
        placeholder="UID del amigo"
        value={friendUid}
        onChange={(e) => setFriendUid(e.target.value)}
      />

      <button
        onClick={addFriend}
        className="w-full bg-green-600 p-2 rounded"
      >
        Agregar amigo
      </button>

      {msg && <p className="text-sm mt-2 text-gray-300">{msg}</p>}

    </div>
  );
}