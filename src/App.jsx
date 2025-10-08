import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout.jsx";

const Home         = lazy(() => import("./pages/Home.jsx"));
const Aadl         = lazy(() => import("./pages/Aadl.jsx"));
const Printing     = lazy(() => import("./pages/Printing.jsx"));
const Internet     = lazy(() => import("./pages/Internet.jsx"));
const Scans        = lazy(() => import("./pages/Scans.jsx"));
const Contact      = lazy(() => import("./pages/Contact.jsx"));
const DocsPrinting = lazy(() => import("./pages/DocsPrinting.jsx")); // 👈 même nom

export default function App() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aadl" element={<Aadl />} />
        <Route path="/printing" element={<Printing />} />
        <Route path="/internet" element={<Internet />} />
        <Route path="/scans" element={<Scans />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/docsprinting" element={<DocsPrinting />} />
        <Route path="*" element={<div className="p-6 text-red-600">404 — Page introuvable</div>} />
      </Routes>
    </Suspense>
  );
}
