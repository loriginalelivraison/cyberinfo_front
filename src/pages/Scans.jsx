// src/pages/Scans.jsx
import { useState, useRef } from "react";
import Logo from "../components/Logo.jsx";

// En dev on lit VITE_API_URL, en prod on laisse vide si tu utilises les rewrites Vercel.
// Si tu n'utilises PAS les rewrites, mets VITE_API_URL=https://<ton-back>.onrender.com
const API = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : "";

export default function Scans() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const inputRef = useRef(null);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    setErr(null);
    setMsg(null);
    if (!f) return setFile(null);
    const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name || "");
    if (!isPdf) {
      setErr("Veuillez sélectionner un fichier PDF.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!file) {
      setErr("Choisissez un fichier PDF.");
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append("file", file);

      // ✅ Endpoint correct en Linux/Render
      const res = await fetch(`${API}/api/convert/pdf-to-word`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const maybeJson = await safeJson(res);
        const msg = maybeJson?.error || `Erreur serveur HTTP ${res.status}`;
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName = (file.name || "document.pdf").replace(/\.pdf$/i, "");
      a.href = url;
      a.download = `${baseName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setMsg("Conversion terminée ✅ Le fichier Word a été téléchargé.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setErr(e.message || "Échec de la conversion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-xl mx-auto px-4 pt-10 text-center">
        <Logo />
        <p className="text-gray-600 mt-1"> PDF → Word </p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={onSubmit} className="bg-white p-4 rounded-2xl shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sélectionner un PDF *</label>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="w-full cursor-pointer"
            />
            {file ? (
              <p className="text-xs text-gray-500 mt-1">
                {file.name} — {(file.size / (1024 * 1024)).toFixed(2)} Mo
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Formats acceptés : PDF. Le Word généré tentera de garder la même mise en forme.
              </p>
            )}
          </div>

          {err && <div className="text-red-600 text-sm">{err}</div>}
          {msg && <div className="text-green-600 text-sm">{msg}</div>}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded-xl bg-amber-500 text-white font-semibold py-2 hover:bg-amber-600 transition disabled:opacity-60"
          >
            {loading ? "Conversion en cours..." : "Convertir en Word"}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          Astuce : si le PDF est un scan (images), il faudra de l’OCR pour un Word pleinement éditable.
        </div>
      </div>
    </div>
  );
}

/* --- helpers --- */
async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
