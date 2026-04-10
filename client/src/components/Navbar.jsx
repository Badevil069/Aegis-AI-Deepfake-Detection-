import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShieldCheck, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { navItems } from '../data/mockData';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    [
      'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-300',
      isActive
        ? 'text-white'
        : 'text-slate-400 hover:text-white',
    ].join(' ');

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-white/8 bg-app-bg/80 backdrop-blur-2xl shadow-glass'
          : 'border-b border-transparent bg-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="group inline-flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan/30 to-brand-indigo/20 transition-all duration-300 group-hover:shadow-neon-cyan group-hover:scale-105">
            <ShieldCheck className="h-5 w-5 text-brand-cyan" strokeWidth={1.8} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-indigo/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">
              Aegis<span className="glow-text">Sentinel</span>
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-slate-500">
              Deepfake Defense Suite
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-x-1 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-brand-cyan to-brand-indigo"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <button className="ghost-button px-4 py-2 text-sm">Login</button>
          <button className="cyber-button inline-flex items-center gap-2 px-4 py-2 text-sm">
            <Zap className="h-3.5 w-3.5" />
            <span>Start Free Audit</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          id="mobile-menu-toggle"
          aria-label="Toggle navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 transition-all hover:border-brand-cyan/40 lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/8 bg-app-bg/95 backdrop-blur-2xl lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={() => setOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="grid grid-cols-2 gap-2 border-t border-white/8 px-4 py-4">
              <button className="ghost-button px-3 py-2.5 text-sm">Login</button>
              <button className="cyber-button px-3 py-2.5 text-sm">Start Audit</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
