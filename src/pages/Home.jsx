import { NavLink } from "react-router-dom";
import Logo from "../components/logo";

export default function Home() {
  const services = [
    { to: "/aadl",     label: " AADL",   emoji: "🏠" },
    { to: "/printing", label: "Impression" ,         emoji: "🖨️" },
    { to: "/internet", label: "Internet",       emoji: "🌐" },
    { to: "/scans",    label: "Scan & Copie",       emoji: "📄" },
    { to: "/contact",  label: "Contact",          emoji: "📞" },
    { to: "/contact",  label: "Contact",          emoji: "📞" },
    { to: "/contact",  label: "Contact",          emoji: "📞" },
    { to: "/contact",  label: "Contact",          emoji: "📞" },
  ];

  return (
    <div className="min-h-screen">
          {/* même header que Home */}
          <div className="max-w-xl mx-auto px-4 pt-10 text-center">
            <Logo />

      {/* Grille 2 colonnes */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          {services.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className="w-1/2 rounded-2xl border p-3 shadow-sm hover:shadow-md transition block bg-amber-100 hover:scale-105 hover:shadow-lg w-full"
            >
              <div className="text-2xl">{s.emoji}</div>
              <div className="mt-2 font-semibold">{s.label}</div>
              
            </NavLink>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Cyberinfo — Tous droits réservés
      </footer>
    </div>
    </div>
  );
}
