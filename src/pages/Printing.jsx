// src/pages/Printing.jsx
import { useEffect, useRef, useState } from "react";
import Logo from "../components/logo.jsx";
import DocsList from "../components/DocsList.jsx";

const API = import.meta.env.VITE_API_URL; // ex: http://localhost:8080

// Endpoints locaux
const PDF_UPLOAD_ENDPOINT   = `${API}/api/upload/pdf`;
const IMAGE_UPLOAD_ENDPOINT = `${API}/api/upload/image`;
const VIDEO_UPLOAD_ENDPOINT = `${API}/api/upload/video`;
const FILE_UPLOAD_ENDPOINT  = `${API}/api/upload/file`; // générique (docx/xlsx/zip/apk...)

// ---------- helpers upload ----------
function resourceTypeFor(file) {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic|bmp|tiff)$/i.test(name)) {
    return "image";
  }
  if (type.startsWith("video/") || type.startsWith("audio/") ||
      /\.(mp4|mov|avi|mkv|webm|m4v|mp3|wav|ogg|m4a)$/i.test(name)) {
    return "video"; // on groupe médias
  }
  if (type === "application/pdf" || /\.pdf$/i.test(name)) {
    return "raw"; // PDF
  }
  // tout le reste (docx/xlsx/pptx/csv/zip/rar/7z/apk/exe/etc.)
  return "file";
}

async function uploadTo(endpoint, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload ${endpoint} HTTP ${res.status}`);
  return res.json(); // { ok, url, bytes, originalname }
}

// ---------- helpers liste ----------
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
      if (item.files.length === 0) continue; // ne rien pousser si plus de fichiers
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
    } else {
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
  }
  return out.filter(Boolean);
}

export default function Printing() {
  const [nom, setNom] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // état de la liste (en bas du formulaire)
  const [docs, setDocs] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState(null);
  const listAnchorRef = useRef(null);

  function onFilesChange(e) {
    const picked = Array.from(e.target.files || []);
    if (picked.length > 20) {
      setErr("Maximum 20 fichiers.");
      setFiles(picked.slice(0, 20));
    } else {
      setErr(null);
      setFiles(picked);
    }
  }

  async function fetchDocs() {
    try {
      setListErr(null);
      setListLoading(true);
      const res = await fetch(`${API}/docimpression`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(normalizeDocs(data));
    } catch (e) {
      setListErr(e.message || "Erreur de chargement");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => { fetchDocs(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!nom.trim()) return setErr("Le nom est obligatoire.");
    if (!files.length) return setErr("Ajoute au moins un fichier.");

    try {
      setLoading(true);

      const imgs   = files.filter((f) => resourceTypeFor(f) === "image");
      const medias = files.filter((f) => resourceTypeFor(f) === "video");
      const pdfs   = files.filter((f) => resourceTypeFor(f) === "raw");
      const others = files.filter((f) => resourceTypeFor(f) === "file");

      const [imgRes, mediaRes, pdfRes, fileRes] = await Promise.all([
        Promise.all(imgs.map(async (f) => {
          const r = await uploadTo(IMAGE_UPLOAD_ENDPOINT, f);
          const ext = (f.name?.split(".").pop() || "jpg").toLowerCase();
          return { url: r.url, secure_url: r.url, public_id: null, format: ext, bytes: r.bytes || f.size, resource_type: "image", original_filename: r.originalname || f.name };
        })),
        Promise.all(medias.map(async (f) => {
          const r = await uploadTo(VIDEO_UPLOAD_ENDPOINT, f);
          const ext = (f.name?.split(".").pop() || "mp4").toLowerCase();
          return { url: r.url, secure_url: r.url, public_id: null, format: ext, bytes: r.bytes || f.size, resource_type: "video", original_filename: r.originalname || f.name };
        })),
        Promise.all(pdfs.map(async (f) => {
          const r = await uploadTo(PDF_UPLOAD_ENDPOINT, f);
          const ext = "pdf";
          return { url: r.url, secure_url: r.url, public_id: null, format: ext, bytes: r.bytes || f.size, resource_type: "raw", original_filename: r.originalname || f.name };
        })),
        Promise.all(others.map(async (f) => {
          const r = await uploadTo(FILE_UPLOAD_ENDPOINT, f);
          const ext = (f.name?.split(".").pop() || "").toLowerCase();
          return { url: r.url, secure_url: r.url, public_id: null, format: ext, bytes: r.bytes || f.size, resource_type: "file", original_filename: r.originalname || f.name };
        })),
      ]);

      const uploaded = [...imgRes, ...mediaRes, ...pdfRes, ...fileRes];

      // Sauvegarde BDD
      const saveRes = await fetch(`${API}/docimpression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nom.trim(),
          files: uploaded.map((u) => ({
            url: u.secure_url || u.url,
            public_id: u.public_id,
            format: u.format,
            bytes: u.bytes,
            resource_type: u.resource_type, // "image" | "video" | "raw" | "file"
            original_filename: u.original_filename,
          })),
        }),
      });
      if (!saveRes.ok) throw new Error(`Save HTTP ${saveRes.status}`);

      setMsg("Documents envoyés avec succès ✅");
      setFiles([]);
      const input = document.getElementById("file-input");
      if (input) input.value = "";

      // 🔄 recharge la liste et scroll vers la section
      await fetchDocs();
      listAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setErr(e.message || "Erreur d'envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-xl mx-auto px-4 pt-10 text-center">
        <Logo />
        <p className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-60 disabled:cursor-not-allowed transition">:أرسل وثائقك هنا</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={onSubmit} className="bg-white p-4 rounded-2xl shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-center">إسم المرسل /اسم الوثائق</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
              placeholder="ex: Ahmed Benali"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fichiers (jusqu'à 20) *</label>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={onFilesChange}
              accept="*/*"
              className="w-full cursor-pointer"
            />
            {!!files.length && (
              <p className="text-xs text-gray-500 mt-1">
                {files.length} fichier(s) sélectionné(s)
              </p>
            )}
          </div>

          {err && <div className="text-red-600 text-sm">{err}</div>}
          {msg && <div className="text-green-600 text-sm">{msg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 text-white font-semibold py-2 hover:bg-amber-600 transition disabled:opacity-60"
          >
            {loading ? "Envoi en cours..." : "Envoyer"}
          </button>
        </form>
      </div>

      {/* --- Liste des documents envoyés (même rendu que la page DocsPrinting) --- */}
      <div ref={listAnchorRef} className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Fichiers récemment envoyés</h2>
          
        </div>

        {listErr && <div className="p-4 text-sm text-red-600">{listErr}</div>}
        {listLoading ? (
          <div className="p-4 text-sm text-gray-500">Chargement…</div>
        ) : (
          <DocsList docs={docs} onRefresh={fetchDocs} />
        )}
      </div>
    </div>
  );
}
