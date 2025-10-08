// 👈 Fichier unique pour le logo
import logo from "../assets/logo.jpeg";

export default function Logo({ className = "" }) {
  return (
    <img
      src={logo}
      alt="Cyberinfo"
      className={`mx-auto h-40 w-auto mb-4 rounded-2xl ${className}`}
    />
  );
}
