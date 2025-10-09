// src/pages/DocsPrinting.jsx
import { useEffect, useState } from "react";
import Logo from "../components/Logo.jsx";
import DocsList from "../components/DocsList.jsx";

const API = import.meta.env.DEV ? (import.meta.env.VITE_API_URL ?? "") : "";

function extFromUrl(u) {
  try {
    const p = new URL(u).pathname;
    const m = p.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeDocs(data) {
  if (!Array.isArray(data)) return [];
  const out = [];

  for (const item of data) {
    if (Array.isArray(item.files)) {
      if (item.files.length === 0) continue;
      for (const f of item.files) {
        const url = f.secure_url || f.url;
        if (!url) continue;
        out.push({
          url,
          public_id: f.public_id || item._id,
          format: f.format || extFromUrl(url),
          bytes: f.bytes,
          resource_type: f.resource_type || item.resource_type,
          uploadedAt: f.createdAt || item.createdAt || item.uploadedAt,
          name: f.original_filename || f.name || item.name,
          note: item.note,
        });
      }
      continue;
    }

    const url = item.secure_url || item.url;
    if (!url) continue;
    out.push({
      url,
      public_id: item.public_id,
      format: item.format || extFromUrl(url),
      bytes: item.bytes,
      resource_type: item.resource_type,
      uploadedAt: item.createdAt || item.uploadedAt,
      name: item.name,
      note: item.note,
    });
  }

  return out.filter((x) => !!x.url);
}

export default function DocsPrinting() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function fetchDocs() {
    try {
      setErr(null);
      setLoading(true);
      const res = await fetch(`${API}/api/docimpression`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(normalizeDocs(data));
    } catch (e) {
      setErr(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDocs(); }, []);

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-xl mx-auto px-4 pt-10 text-center">
        <Logo />
        <p className="text-gray-600 mt-1">:الوثائق و الصور للطباعة</p>
      </div>

      {err && <div className="max-w-5xl mx-auto p-6 text-sm text-red-600">{err}</div>}

      {loading ? (
        <div className="max-w-5xl mx-auto p-6 text-sm text-gray-500">Chargement…</div>
      ) : (
        <DocsList docs={docs} onRefresh={fetchDocs} />
      )}
    </div>
  );
}
