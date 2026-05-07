"use client";

import VipStickerCard from "@/components/ui/vip-sticker-card";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

import AuthForm from "@/components/AuthForm";
import { stickers } from "@/lib/stickers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type Filter = "all" | "owned" | "missing" | "duplicates";

export default function Home() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coleccion, setColeccion] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  
  const [friends, setFriends] = useState<any[]>([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [msg, setMsg] = useState("");
  const [friendsData, setFriendsData] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);

  // 📊 CÁLCULO DE PROGRESO REAL
  const totalEstampas = stickers.length;
  const obtenidas = Object.keys(coleccion).length;
  const porcentaje = totalEstampas > 0 ? (obtenidas / totalEstampas) * 100 : 0;

  // 🔁 LÓGICA DE INTERCAMBIOS
  const getTradeSuggestions = () => {
    const myDuplicates = Object.entries(coleccion)
      .flatMap(([num, qty]) => qty > 1 ? Array(qty - 1).fill(num) : []);
      
    const myMissing = stickers.filter((s) => !coleccion[s.numero] || coleccion[s.numero] === 0).map((s) => s.numero);
    const suggestions: any[] = [];

    friendsData.forEach((friend) => {
      const friendStickers = friend.stickers || {};
      const friendMissing = stickers.filter((s) => !friendStickers[s.numero]).map((s) => s.numero);
      const friendDuplicates = Object.entries(friendStickers).filter(([_, q]) => (q as number) > 1).map(([n]) => n);

      const iCanGive = myDuplicates.filter((num) => friendMissing.includes(num));
      const friendCanGive = friendDuplicates.filter((num) => myMissing.includes(num));

      iCanGive.forEach((give) => {
        friendCanGive.forEach((receive) => {
          suggestions.push({
            friendUsername: friend.username,
            give,
            giveName: `${give} - ${stickers.find((s) => s.numero === give)?.nombre || ""}`,
            receive,
            receiveName: `${receive} - ${stickers.find((s) => s.numero === receive)?.nombre || ""}`,
          });
        });
      });
    });
    return suggestions.slice(0, 10);
  };

  // 🔐 CARGA INICIAL
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", u.uid);
      const unsubUser = onSnapshot(userRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setColeccion(data.stickers || {});
          setUsername(data.username || "Sin username");
          const fList = data.friends || [];
          setFriends(fList);

          const fData = await Promise.all(
            fList.map(async (f: any) => {
              const fSnap = await getDoc(doc(db, "users", f.uid));
              return { ...f, ...fSnap.data() };
            })
          );
          setFriendsData(fData);
        }
        setLoading(false);
      });

      const q = query(collection(db, "friend_requests"), where("toUid", "==", u.uid));
      const qTrades = query(
  collection(db, "trade_requests"),
  where("toUid", "==", u.uid),
  where("status", "==", "pending")
);

const unsubTrades = onSnapshot(qTrades, (snap) => {
  setTradeRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});
      const unsubRequests = onSnapshot(q, (snap) => {
        setPendingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
  unsubUser();
  unsubRequests();
  unsubTrades();
    };
    });

    return () => unsubAuth();
  }, []);

  const sendFriendRequest = async () => {
    if (!friendUsername) return;
    setMsg("Buscando...");
    const q = query(collection(db, "users"), where("username", "==", friendUsername));
    const result = await getDocs(q);
    if (result.empty) { setMsg("❌ Usuario no encontrado"); return; }
    const friendDoc = result.docs[0];
    const friendId = friendDoc.id;
    if (friendId === user.uid) { setMsg("❌ Eres tú mismo"); return; }
    if (friends.some(f => f.uid === friendId)) { setMsg("✉️ Ya son amigos"); return; }

    const myDataSnap = await getDoc(doc(db, "users", user.uid));
    const myUsername = myDataSnap.data()?.username || user.email;

    await addDoc(collection(db, "friend_requests"), {
      fromUid: user.uid,
      fromUsername: myUsername,
      toUid: friendId,
      status: "pending"
    });
    setFriendUsername("");
    setMsg("✅ Solicitud enviada");
  };

  const sendTradeRequest = async (toUid: string, give: string, receive: string) => { const mySnap = await getDoc(doc(db, "users", user.uid)); const myUsername = mySnap.data()?.username || user.email; await addDoc(collection(db, "trade_requests"), { fromUid: user.uid, fromUsername: myUsername, toUid, give, receive, status: "pending", createdAt: Date.now(), }); };

  const acceptRequest = async (request: any) => {
    const myDataSnap = await getDoc(doc(db, "users", user.uid));
    const myUsername = myDataSnap.data()?.username || user.email;

    await setDoc(doc(db, "users", user.uid), {
      friends: arrayUnion({ uid: request.fromUid, username: request.fromUsername })
    }, { merge: true });

    await setDoc(doc(db, "users", request.fromUid), {
      friends: arrayUnion({ uid: user.uid, username: myUsername })
    }, { merge: true });

    await deleteDoc(doc(db, "friend_requests", request.id));
  };

  const acceptTrade = async (trade: any) => {
  const myRef = doc(db, "users", user.uid);
  const friendRef = doc(db, "users", trade.fromUid);

  const mySnap = await getDoc(myRef);
  const friendSnap = await getDoc(friendRef);

  const myData = { ...(mySnap.data()?.stickers || {}) };
  const friendData = { ...(friendSnap.data()?.stickers || {}) };

  // 🔒 VALIDACIÓN CLAVE
  if (!friendData[trade.give] || friendData[trade.give] < 1) return;
  if (!myData[trade.receive] || myData[trade.receive] < 1) return;

  // 👉 RESTAR PRIMERO
  myData[trade.receive] -= 1;
  friendData[trade.give] -= 1;

  // 👉 LIMPIEZA (evitar negativos raros)
  if (myData[trade.receive] <= 0) delete myData[trade.receive];
  if (friendData[trade.give] <= 0) delete friendData[trade.give];

  // 👉 SUMAR DESPUÉS
  myData[trade.give] = (myData[trade.give] || 0) + 1;
  friendData[trade.receive] = (friendData[trade.receive] || 0) + 1;

  await setDoc(myRef, { stickers: myData }, { merge: true });
  await setDoc(friendRef, { stickers: friendData }, { merge: true });

  await deleteDoc(doc(db, "trade_requests", trade.id));
};

  const saveStickers = async (data: any) => {
    setColeccion(data);
    await setDoc(doc(db, "users", user.uid), { stickers: data }, { merge: true });
  };

  const add = (num: string) => saveStickers({ ...coleccion, [num]: (coleccion[num] || 0) + 1 });
  const remove = (num: string) => {
    const updated = { ...coleccion, [num]: (coleccion[num] || 0) - 1 };
    if (updated[num] <= 0) delete updated[num];
    saveStickers(updated);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Cargando...</div>;
  if (!user) return <AuthForm initialStep={localStorage.getItem("pendingVerification") ? "verify" : "form"} />;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"> <center>Control de Figuritas Álbum del Mundial Panini 2026</center></h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-12 h-12 rounded-2xl bg-white/10 text-2xl">☰</button>
      </div>
<div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 mb-4">
  <p className="text-gray-400 text-xs">Tu perfil</p>
  
  <p className="text-yellow-400 font-bold text-lg">{username}</p>
</div>

      {/* PROGRESO */}
      <div className="bg-white/10 border border-white/10 rounded-3xl p-5 mb-6">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold">Tu Progreso</p>
            <p className="text-3xl font-black">{porcentaje.toFixed(1)}%</p>
          </div>
          <p className="text-xs text-gray-400"><span className="text-yellow-500 font-bold">{obtenidas}</span> / {totalEstampas}</p>
        </div>
        <div className="w-full bg-black/50 h-4 rounded-full overflow-hidden border border-white/5 relative">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-1000"
            style={{ width: `${porcentaje}%`, opacity: porcentaje > 0 ? 1 : 0 }} 
          />
        </div>
      </div>

      {menuOpen && (
        <div className="bg-white/10 rounded-3xl p-4 mb-6 flex flex-col gap-3 border border-white/10">
          {["all", "owned", "missing", "duplicates"].map((f) => (
            <button key={f} onClick={() => { setFilter(f as Filter); setMenuOpen(false); }} className="p-3 hover:bg-white/10 rounded-xl text-left capitalize">
              {f === "all" ? "📚 Ver Todos" : f === "owned" ? "✅ Tengo" : f === "missing" ? "❌ Faltan" : "🔁 Repetidos"}
            </button>
          ))}
          <button onClick={() => signOut(auth)} className="p-3 text-red-400 text-left">Cerrar Sesión</button>
        </div>
      )}

      {/* SOLICITUDES */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-3xl p-5 mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">📩 Solicitudes</h2>
          <div className="flex flex-col gap-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-sm">De: <span className="font-bold text-yellow-500">{req.fromUsername}</span></p>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(req)} className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-bold">Aceptar</button>
                  <button onClick={() => deleteDoc(doc(db, "friend_requests", req.id))} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-xl text-xs">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INTERCAMBIOS */}
{tradeRequests.length > 0 && (
  <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-5 mb-8">
    <h2 className="text-xl font-bold mb-4 text-green-400">
      🔁 Intercambios
    </h2>

    {tradeRequests.map((t) => (
      <div key={t.id} className="bg-black/40 p-4 rounded-xl mb-3">
        <p className="text-sm">
          De: <span className="text-green-400 font-bold">{t.fromUsername}</span>
        </p>

        <p>📤 Te da: {t.give}</p>
        <p>📥 Quiere: {t.receive}</p>

        <button
          onClick={() => acceptTrade(t)}
          className="bg-green-500 text-black px-4 py-2 rounded-xl mt-2"
        >
          Aceptar intercambio
        </button>
      </div>
    ))}
  </div>
)}

      {/* COMUNIDAD */}
      <div className="bg-white/10 rounded-3xl p-5 mb-8 border border-white/5">
        <h2 className="text-xl font-bold mb-4 text-blue-400">👥 TRCS</h2>
        <div className="flex gap-2 mb-6">
          <input 
            value={friendUsername} 
            onChange={(e) => setFriendUsername(e.target.value)} 
            placeholder="Ingrese aquí el username respetando mayúsculas" 
            className="flex-1 p-4 rounded-2xl bg-black/30 border border-white/10 outline-none"
          />
          <button onClick={sendFriendRequest} className="bg-blue-600 px-6 rounded-2xl font-bold">Agregar</button>
        </div>
        {msg && <p className="mb-4 text-sm text-yellow-400 px-2">{msg}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((f, i) => (
            <Link key={f.uid || i} href={`/profile/${f.uid}`} className="flex items-center gap-3 bg-black/30 border border-white/5 p-4 rounded-2xl hover:bg-white/5 transition group">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">👤</div>
              <div><p className="font-bold text-white text-sm">{f.username}</p><p className="text-[10px] text-blue-300 uppercase">Ver Perfil ➔</p></div>
            </Link>
          ))}
        </div>
      </div>

      {/* CANJES */}
      <div className="bg-white/10 rounded-3xl p-5 mb-8 border border-white/5">
        <h2 className="text-xl font-bold mb-4 text-green-400">🔁 Posibles Canjes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getTradeSuggestions().length === 0 ? <p className="text-gray-500 text-sm px-2">No hay intercambios.</p> : getTradeSuggestions().map((t, i) => (
            <div key={i} className="bg-black/30 border border-white/5 p-4 rounded-2xl text-xs">
              <p className="text-blue-300 mb-2 font-bold uppercase tracking-tighter">Amigo: {t.friendUsername}</p>
              <button
  onClick={() =>
    sendTradeRequest(
      t.friendUid || friendsData.find(f => f.username === t.friendUsername)?.uid,
      t.give,
      t.receive
    )
  }
  className="mt-3 bg-blue-500 text-black px-3 py-2 rounded-xl text-xs font-bold"
>
  📤 Enviar intercambio
</button>
              <div className="flex justify-between items-center">
                <div className="text-red-300">📤 Das: {t.giveName}</div>
                <div className="text-gray-600 font-bold px-1">⇄</div>
                <div className="text-green-300 text-right">📥 Recibes: {t.receiveName}</div>
              </div>
            </div>
            
          ))}
        </div>
      </div>

      {/* ÁLBUM POR PAÍSES */}
      {Object.entries(
        stickers.reduce((acc: any, s: any) => {
          const pais = s.pais || "Otros";
          if (!acc[pais]) acc[pais] = [];
          acc[pais].push(s);
          return acc;
        }, {})
      ).map(([pais, lista]: any) => {
        const filtered = lista.filter((s: any) => {
          const q = coleccion[s.numero] || 0;
          if (filter === "owned") return q > 0;
          if (filter === "missing") return q === 0;
          if (filter === "duplicates") return q > 1;
          return true;
        });

        if (filtered.length === 0) return null;

        return (
          <div key={pais} className="mb-10">
            <h3 className="text-sm font-bold mb-4 text-gray-400 px-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-yellow-500 rounded-full"></span> {pais}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map((s: any) => {
                const qty = coleccion[s.numero] || 0;
                return (
                  <VipStickerCard 
                    key={s.numero} 
                    sticker={s} 
                    cantidad={filter === "duplicates" ? qty - 1 : qty} 
                    onClick={() => setSelected(s)} 
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* MODAL EDITAR STICKER (FUERA DEL BUCLE) */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] max-w-[90vw] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-yellow-500 font-black">{selected?.numero}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-2xl font-bold mb-1">{selected?.nombre}</p>
            <p className="text-gray-500 text-sm mb-8 font-bold uppercase tracking-widest">{selected?.pais}</p>
            <div className="flex gap-8 items-center justify-center">
              <button onClick={() => remove(selected?.numero)} className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 text-red-500 border border-red-500/20 text-3xl flex items-center justify-center transition active:scale-90">－</button>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black leading-none">{coleccion[selected?.numero] || 0}</span>
                <span className="text-[10px] text-gray-500 uppercase font-black mt-2 tracking-tighter">Total</span>
              </div>
              <button onClick={() => add(selected?.numero)} className="w-16 h-16 rounded-[1.5rem] bg-green-500/10 text-green-500 border border-green-500/20 text-3xl flex items-center justify-center transition active:scale-90">＋</button>
            </div>
            { (coleccion[selected?.numero] || 0) > 1 && (
              <p className="mt-6 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                ✨ Tienes {(coleccion[selected?.numero] || 0) - 1} repetida(s)
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}