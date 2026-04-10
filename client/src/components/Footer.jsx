import { Link } from 'react-router-dom';
import { ShieldCheck, Globe, MessageCircle, ExternalLink, Code2 } from 'lucide-react';

const quickLinks = [
  { label: 'Home', path: '/' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Detect', path: '/detect' },
  { label: 'Live Detection', path: '/live' },
];

const productLinks = [
  { label: 'Use Cases', path: '/use-cases' },
  { label: 'Results Dashboard', path: '/results' },
  { label: 'Contact', path: '/contact' },
];

const socialLinks = [
  { icon: Code2, href: '#', label: 'GitHub' },
  { icon: ExternalLink, href: '#', label: 'LinkedIn' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      {/* Gradient line at top */}
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
        {/* Main footer grid */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="group inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-cyan/25 to-brand-indigo/15">
                <ShieldCheck className="h-4 w-4 text-brand-cyan" strokeWidth={1.8} />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Aegis<span className="glow-text">Sentinel</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Enterprise-grade multimodal deepfake defense for video, image, voice, and live streams.
            </p>

            {/* Social links */}
            <div className="mt-6 flex gap-2">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-slate-500 transition-all duration-300 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 hover:text-brand-cyan"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Platform
            </h4>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-slate-500 transition-colors hover:text-brand-cyan">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Resources
            </h4>
            <ul className="mt-4 space-y-3">
              {productLinks.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-slate-500 transition-colors hover:text-brand-cyan">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Notice */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Security
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              This frontend demonstrates detection workflows with simulated data. No production API credentials are exposed.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] uppercase tracking-wider text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All Systems Operational
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Aegis Sentinel. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a href="#" className="transition-colors hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-slate-400">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-slate-400">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
