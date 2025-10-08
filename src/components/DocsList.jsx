import { useMemo, useState, } from "react";
const API = import.meta.env.DEV ? (import.meta.env.VITE_API_URL ?? "") : "";

// ---- helpers ---------------------------------------------------------------
function guessFormatFromUrl(u) {
  try {
    const m = new URL(u).pathname.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : undefined;
  } catch { return undefined; }
}

function isLocalPdfUrl(url)   { try { return new URL(url).pathname.includes("/uploads/pdfs/");   } catch { return false; } }
function isLocalImageUrl(url) { try { return new URL(url).pathname.includes("/uploads/images/"); } catch { return false; } }
function isLocalMediaUrl(url) { try { return new URL(url).pathname.includes("/uploads/videos/"); } catch { return false; } }
function isLocalFileUrl(url)  { try { return new URL(url).pathname.includes("/uploads/files/");  } catch { return false; } }

function deriveResourceType({ url, resource_type, format }) {
  if (resource_type) return resource_type;

  if (isLocalPdfUrl(url)) return "raw";
  if (isLocalImageUrl(url)) return "image";
  if (isLocalMediaUrl(url)) {
    const ext = (format || guessFormatFromUrl(url) || "").toLowerCase();
    if (["mp3","wav","ogg","m4a"].includes(ext)) return "audio";
    return "video";
  }
  if (isLocalFileUrl(url)) return "file";

  const ext = (format || guessFormatFromUrl(url) || "").toLowerCase();
  if (["pdf"].includes(ext)) return "raw";
  if (["mp4","webm","mov","mkv","avi","m4v"].includes(ext)) return "video";
  if (["mp3","wav","ogg","m4a"].includes(ext)) return "audio";
  if (["jpg","jpeg","png","gif","webp","heic","bmp","tiff"].includes(ext)) return "image";
  return "file";
}

// URL d’ouverture
function buildOpenUrl({ url, public_id, format, resource_type }) {
  const rt = deriveResourceType({ url, resource_type, format });
  if (isLocalPdfUrl(url))   return url || "#";
  if (isLocalImageUrl(url)) return url || "#";
  if (isLocalMediaUrl(url)) return url || "#";
  if (isLocalFileUrl(url))  return url || "#";
  try { if (url && url.includes("/raw/upload/")) return url; } catch {}
  return url || "#";
}

// URL de téléchargement
function buildDownloadUrl({ url, public_id, format, resource_type }) {
  if (isLocalPdfUrl(url))   { try { const f = new URL(url).pathname.split("/").pop(); return `${API}/api/upload/pdf/${f}`; } catch { return url || "#"; } }
  if (isLocalImageUrl(url)) { try { const f = new URL(url).pathname.split("/").pop(); return `${API}/api/upload/image/${f}`; } catch { return url || "#"; } }
  if (isLocalMediaUrl(url)) { try { const f = new URL(url).pathname.split("/").pop(); return `${API}/api/upload/video/${f}`; } catch { return url || "#"; } }
  if (isLocalFileUrl(url))  { try { const f = new URL(url).pathname.split("/").pop(); return `${API}/api/upload/file/${f}`; } catch { return url || "#"; } }
  try {
    if (url && url.includes("/api/upload/")) {
      const u = new URL(url);
      u.pathname = u.pathname.replace("/api/upload/", "/api/upload/fl_attachment/");
      return u.toString();
    }
  } catch {}
  return url || "#";
}

function humanSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} Mo`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} Go`;
}

// ---- UI --------------------------------------------------------------------
function FileCard({ file, onDeleted }) {
  const { url, public_id, format, bytes, resource_type, name, uploadedAt } = file;

  const rt = useMemo(
    () => deriveResourceType({ url, resource_type, format }),
    [url, resource_type, format]
  );

  const openUrl = useMemo(
    () => buildOpenUrl({ url, public_id, format, resource_type: rt }),
    [url, public_id, format, rt]
  );

  const downloadUrl = useMemo(
    () => buildDownloadUrl({ url, public_id, format, resource_type: rt }),
    [url, public_id, format, rt]
  );

  async function handleDelete() {
    const ok = confirm(`Supprimer ce fichier "${name || url}" ?`);
    if (!ok) return;
    try {
      const endpoint = `${API}/api/docimpression/file?url=${encodeURIComponent(url)}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Suppression échouée");
      onDeleted?.();
    } catch (e) {
      alert(e.message || "Erreur de suppression");
    }
  }

  // Vignette / preview
  let preview = null;

  if (rt === "image") {
    preview = (
      <a href={openUrl} target="_blank" rel="noreferrer">
        <img
          src={openUrl}
          alt={name || public_id}
          className="w-full h-40 object-cover rounded-lg border"
          loading="lazy"
        />
      </a>
    );
  } else if (rt === "video") {
    preview = <video src={openUrl} controls className="w-full h-40 rounded-lg border" />;
  } else if (rt === "audio") {
    preview = <audio src={openUrl} controls className="w-full" />;
  } else {
    const ext = (format || guessFormatFromUrl(url) || "").toUpperCase();
    const isPDF =
      (format || "").toLowerCase() === "pdf" ||
      (openUrl || "").toLowerCase().includes(".pdf") ||
      isLocalPdfUrl(url);

    preview = (
      <a
        href={openUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center w-full h-40 rounded-lg border bg-gray-50"
        title="Ouvrir"
      >
        <div className="text-sm text-gray-600">
          {isPDF ? "📄 PDF" : "📦 Fichier"} — {ext || "?"}
        </div>
      </a>
    );
  }

  return (
    <div className="rounded-2xl border p-3 space-y-3 shadow-sm bg-purple-50">
      {preview}

      <div className="text-sm">
        <div className="font-medium truncate">{name || public_id || "(sans nom)"}</div>
        <div className="text-gray-500">
          {rt?.toUpperCase()} · {(format || guessFormatFromUrl(url) || "").toUpperCase()} · {humanSize(bytes)}
        </div>
        {uploadedAt && (
          <div className="text-gray-400 text-xs">
            {new Date(uploadedAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={downloadUrl}
          className="flex-1 text-center rounded-xl bg-amber-500 text-white py-2 font-semibold hover:bg-amber-600 transition"
        >
          تحميل
        </a>
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 text-center rounded-xl border py-2 font-semibold bg-blue-400 transition"
        >
          فتح
        </a>
        <button
          onClick={handleDelete}
          className=" min-w-[80px] text-center rounded-xl border border-red-500 text-red-600 py-2 font-semibold hover:bg-red-50 transition"
          title="Supprimer"
        >
          مسح
        </button>
      </div>
    </div>
  );
}

export default function DocsList({ docs = [], onRefresh }) {
  const [deletingTick, setDeletingTick] = useState(0);

  if (!docs.length) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-sm text-gray-500">
        Aucun fichier pour l’instant.
      </div>
    );
  }

  function handleDeleted() {
    // si le parent a fourni onRefresh (Pages/DocsPrinting), on l’utilise
    if (onRefresh) return onRefresh();
    // sinon, petit tick pour forcer un re-render si tu gères localement
    setDeletingTick((t) => t + 1);
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Fichiers reçus</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Actualiser
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((f, i) => (
          <FileCard key={(f.public_id || f.url || "k") + "-" + i} file={f} onDeleted={handleDeleted} />
        ))}
      </div>
    </div>
  );
}
