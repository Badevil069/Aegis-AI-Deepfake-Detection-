import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 py-12 bg-[#010206] relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-6 max-w-[1440px] mx-auto">
        <Link
          to="/"
          className="text-cyan-400 font-black font-display text-lg drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] interactive select-none"
        >
          DeepShield AI
        </Link>

        <div className="font-sans text-sm text-slate-500">
          © {new Date().getFullYear()} DeepShield AI. High-Fidelity Intelligence.
        </div>

        <div className="flex flex-wrap gap-8 font-sans text-sm text-slate-500">
          <a
            href="#"
            className="hover:text-cyan-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] interactive"
          >
            Privacy Protocol
          </a>
          <a
            href="#"
            className="hover:text-cyan-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] interactive"
          >
            Security Standards
          </a>
          <a
            href="#"
            className="hover:text-cyan-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] interactive"
          >
            Neural API
          </a>
          <Link
            to="/contact"
            className="hover:text-cyan-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(0,242,255,0.5)] interactive"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
