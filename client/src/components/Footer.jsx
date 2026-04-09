import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Detect', path: '/detect' },
  { label: 'Live Detection', path: '/live' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Contact', path: '/contact' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-app-bg/80">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 md:grid-cols-3 md:px-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Aegis Sentinel</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Enterprise-grade multimodal deepfake defense for image, video, voice, and live collaboration channels.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Quick Links</h4>
          <ul className="mt-3 space-y-2">
            {quickLinks.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="text-sm text-slate-300 transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Security Notice</h4>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            This frontend demonstrates detection workflows with simulated data and no production API credentials.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500 md:px-6">
        Copyright {new Date().getFullYear()} Aegis Sentinel. All rights reserved.
      </div>
    </footer>
  );
}
