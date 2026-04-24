import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Detection', path: '/detect' },
  { label: 'Monitoring', path: '/live' },
  { label: 'Dashboard', path: '/results' },
  { label: 'Coming Soon', path: '/use-cases' },
];

const notifications = [
  { id: 1, type: 'alert', title: 'Deepfake Detected', desc: 'High-risk synthetic media found in upload batch #4821.', time: '2 min ago', read: false },
  { id: 2, type: 'success', title: 'Scan Complete', desc: 'Document verification for contract_v3.pdf passed.', time: '18 min ago', read: false },
  { id: 3, type: 'warning', title: 'Stream Anomaly', desc: 'Unusual frame artifacts detected in live feed #12.', time: '1 hr ago', read: false },
  { id: 4, type: 'info', title: 'System Update', desc: 'Detection model v2.4.1 deployed successfully.', time: '3 hrs ago', read: true },
  { id: 5, type: 'success', title: 'Weekly Report', desc: 'Your weekly threat report is ready for download.', time: '5 hrs ago', read: true },
];

const typeConfig = {
  alert: { icon: 'warning', color: 'text-rose-400', bg: 'bg-rose-400/10', dot: 'bg-rose-400' },
  warning: { icon: 'error_outline', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400' },
  success: { icon: 'check_circle', color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  info: { icon: 'info', color: 'text-cyan-400', bg: 'bg-cyan-400/10', dot: 'bg-cyan-400' },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  const notifRef = useRef(null);

  const unreadCount = notifList.filter((n) => !n.read).length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dark/light mode
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
    }
  };

  const markAllRead = () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifList((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const linkClass = ({ isActive }) =>
    [
      'relative text-sm transition-all duration-300 nav-link-fantasy font-sans tracking-tight',
      isActive ? 'text-cyan-400' : 'text-slate-400',
    ].join(' ');

  return (
    <nav
      className={[
        'fixed top-0 w-full border-b z-50 transition-all duration-500 ease-in-out',
        scrolled
          ? 'border-white/8 bg-[#02040a]/70 backdrop-blur-3xl'
          : 'border-white/5 bg-[#02040a]/40 backdrop-blur-3xl',
        'hover:bg-[#02040a]/60',
      ].join(' ')}
    >
      <div className="flex justify-between items-center px-6 py-4 max-w-[1440px] mx-auto relative z-10">
        {/* Logo + Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-blue-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] font-display interactive animate-pulse-glow select-none"
          >
            DeepShield AI
          </Link>

          <div className="hidden md:flex gap-6">
            {navLinks.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1">
            {/* Notifications Button */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative text-slate-400 hover:text-white transition-colors p-2 hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] rounded-full interactive"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-[#02040a]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-[380px] rounded-2xl border border-cyan-500/15 bg-[#0a0f1a]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400 text-lg">notifications_active</span>
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-cyan-400/60 hover:text-cyan-400 transition-colors interactive"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifList.map((notif) => {
                        const cfg = typeConfig[notif.type] || typeConfig.info;
                        return (
                          <button
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] border-b border-white/[0.03] ${
                              !notif.read ? 'bg-cyan-500/[0.03]' : ''
                            }`}
                          >
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                              <span className={`material-symbols-outlined text-base ${cfg.color}`}>{cfg.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} shrink-0`} />}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.desc}</p>
                              <p className="text-[10px] text-slate-600 mt-1">{notif.time}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-white/6 text-center">
                      <Link
                        to="/results"
                        className="text-[11px] text-cyan-400/60 hover:text-cyan-400 transition-colors interactive"
                        onClick={() => setNotifOpen(false)}
                      >
                        View all activity →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="relative text-slate-400 hover:text-white transition-colors p-2 hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] rounded-full interactive"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-5 w-5 text-amber-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <Link
            to="/detect"
            className="hidden md:inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-sans text-xs font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] hover:scale-105 transition-all interactive"
          >
            Secure Feed
          </Link>

          {/* Mobile Toggle */}
          <button
            id="mobile-menu-toggle"
            aria-label="Toggle navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 transition-all hover:border-cyan-400/40 md:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/8 bg-[#02040a]/95 backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile theme toggle + notifications */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-white/6">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors interactive"
              >
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </button>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-sm text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">notifications</span>
                {unreadCount > 0 ? `${unreadCount} new` : 'All read'}
              </span>
            </div>

            <div className="border-t border-white/8 px-4 py-4">
              <Link
                to="/detect"
                className="block w-full text-center bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-sans text-xs font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded"
                onClick={() => setOpen(false)}
              >
                Secure Feed
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
