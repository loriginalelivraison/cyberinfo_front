import { Outlet } from "react-router-dom";
import Logo from "./logo";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="pt-6">
        <Logo className="h-12" />
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Cyberinfo — Tous droits réservés
      </footer>
    </div>
  );
}
