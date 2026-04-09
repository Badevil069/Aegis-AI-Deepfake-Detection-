import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { navItems } from '../data/mockData';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const navLinkClass = ({ isActive }) =>
    [
      'rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300',
      isActive
        ? 'bg-brand-indigo/35 text-white shadow-soft-glow'
        : 'text-slate-300 hover:bg-white/10 hover:text-white',
    ].join(' ');

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-app-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="group inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan/40 to-brand-indigo/30 shadow-soft-glow transition-transform duration-300 group-hover:scale-105">
            <ShieldCheck className="h-5 w-5 text-brand-cyan" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">Aegis Sentinel</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-brand-cyan/80">Deepfake Defense Suite</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={closeMenu}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-cyan/60 hover:text-white">
            Login
          </button>
          <button className="cyber-button px-4 py-2 text-sm">Start Free Audit</button>
        </div>

        <button
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-slate-200 lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 bg-app-bg/95 px-4 py-4 lg:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={closeMenu}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200">Login</button>
              <button className="cyber-button px-3 py-2 text-sm">Start Audit</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
