import { useState } from "react";
import Logo from "../components/Logo.jsx";
const API = import.meta.env.VITE_API_URL; // ex: http://localhost:8080

export default function Aadl() {
  const [name, setName] = useState("");
  const [familyname, setFamilyname] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!name.trim() || !phone.trim()) { setErr("Nom et téléphone obligatoires."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/aadl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), familyname: familyname.trim(), phone: phone.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setMsg("✅ تم تسجيلك بنجاح");
      setName(""); setFamilyname(""); setPhone("");
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen">
          {/* même header que Home */}
          <div className="max-w-xl mx-auto px-4 pt-10 text-center">
            <Logo />
      {/* Conteneur centré et responsive */}
      <div className="min-h-screen flex items-start justify-center px-4 py-10">
        {/* Carte formulaire */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-center">Demande AADL</h1>
          <p className="text-gray-600 text-center mt-1">! سجل نفسك</p>

          <form onSubmit={onSubmit} className="mt-6 grid gap-3">
            <input
              className="border p-3 rounded w-full"
              placeholder="Nom *"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
            <input
              className="border p-3 rounded w-full"
              placeholder="Prénom"
              value={familyname}
              onChange={(e)=>setFamilyname(e.target.value)}
            />
            <input
              className="border p-3 rounded w-full"
              placeholder="Téléphone *"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
            />
            <button
              disabled={loading}
              className="bg-black text-white py-3 rounded w-full hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? "Envoi…" : "Ajouter"}
            </button>

            {msg && <p className="text-green-600 text-center">{msg}</p>}
            {err && <p className="text-red-600 text-center">{err}</p>}
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
