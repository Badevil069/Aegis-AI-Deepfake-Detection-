import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  BadgeDollarSign, Building2, CheckCircle2, Megaphone, Newspaper,
  Scale, Shield, Lock, Sparkles, Zap, Brain, Eye, Send,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import RadarScan from '../components/RadarScan';
import FantasyBackground from '../components/FantasyBackground';

/* ─── Upcoming features — shown as locked/holographic preview cards ─── */
const upcomingFeatures = [
  {
    icon: Brain,
    title: 'Autonomous Threat Hunting',
    description: 'Self-learning AI agents that proactively scan your entire media pipeline for synthetic anomalies without human intervention.',
    status: 'In Development',
    progress: 72,
    eta: 'Q3 2026',
  },
  {
    icon: Eye,
    title: 'Real-Time Audio Deepfake',
    description: 'Voice clone detection during live phone calls and VoIP conferences with sub-200ms response time.',
    status: 'Alpha Testing',
    progress: 45,
    eta: 'Q4 2026',
  },
  {
    icon: Shield,
    title: 'Blockchain Provenance',
    description: 'Immutable media authentication chain — every scan, every result, cryptographically sealed on-chain.',
    status: 'Research Phase',
    progress: 28,
    eta: 'Q1 2027',
  },
  {
    icon: Zap,
    title: 'Edge Deployment SDK',
    description: 'Run DeepShield detection models directly on edge devices — mobile, IoT, and embedded systems.',
    status: 'Planning',
    progress: 15,
    eta: 'Q2 2027',
  },
  {
    icon: Sparkles,
    title: 'Generative AI Watermarking',
    description: 'Inject invisible forensic watermarks into AI-generated content for downstream authenticity verification.',
    status: 'In Development',
    progress: 60,
    eta: 'Q3 2026',
  },
  {
    icon: Megaphone,
    title: 'Social Media Monitor',
    description: 'Automated deepfake scanning across Twitter, YouTube, TikTok and Instagram with real-time alert dashboards.',
    status: 'Alpha Testing',
    progress: 38,
    eta: 'Q4 2026',
  },
];

/* ─── Scroll reveal wrapper ─── */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Countdown Timer ─── */
function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    // Next big launch: Q3 2026 (July 1, 2026)
    const target = new Date('2026-07-01T00:00:00').getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hours', value: time.hours },
    { label: 'Minutes', value: time.mins },
    { label: 'Seconds', value: time.secs },
  ];

  return (
    <div className="flex gap-3 sm:gap-5 justify-center">
      {units.map(({ label, value }) => (
        <div key={label} className="text-center">
          <motion.div
            key={value}
            initial={{ scale: 1.1, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-sm flex items-center justify-center"
          >
            <span className="font-display text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-500">
              {String(value).padStart(2, '0')}
            </span>
          </motion.div>
          <span className="text-[9px] uppercase tracking-[0.2em] text-slate-600 mt-2 block">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Feature Preview Card (holographic/locked style) ─── */
function FeaturePreviewCard({ feature, index }) {
  const Icon = feature.icon;
  const statusColor = {
    'In Development': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    'Alpha Testing': 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    'Research Phase': 'text-violet-400 border-violet-400/20 bg-violet-400/5',
    'Planning': 'text-slate-400 border-slate-400/20 bg-slate-400/5',
  }[feature.status] || 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5';

  return (
    <Reveal delay={index * 80}>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        className="relative group rounded-2xl border border-white/[0.06] bg-[#0a0f1a]/60 backdrop-blur-md p-6 overflow-hidden transition-all duration-500 hover:border-cyan-500/30"
      >
        {/* Holographic shimmer overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(0,242,255,0.04) 50%, transparent 70%)',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Lock icon overlay */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <Lock className="h-5 w-5 text-cyan-400" />
        </div>

        {/* Icon */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/10 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,242,255,0.15)]">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-100 transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4 group-hover:text-slate-300 transition-colors">
          {feature.description}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-600">Progress</span>
            <span className="text-[10px] font-mono text-cyan-400/70">{feature.progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${feature.progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ boxShadow: '0 0 8px rgba(0,242,255,0.4)' }}
            />
          </div>
        </div>

        {/* Status + ETA */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {feature.status}
          </span>
          <span className="text-[10px] text-slate-600 font-mono">ETA {feature.eta}</span>
        </div>
      </motion.div>
    </Reveal>
  );
}

/* ─── Main Page ─── */
export default function UseCasesPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <PageTransition className="!max-w-full !px-0 space-y-0 pb-0 pt-0">
      <div className="pointer-events-none fixed inset-0 z-0 mesh-bg opacity-40" />
      <FantasyBackground />

      {/* ═══ Hero Section with Radar ═══ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden border-b border-white/5">
        <div className="max-w-[1440px] mx-auto w-full px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left — Text */}
          <div className="text-center lg:text-left py-20">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-400 font-semibold uppercase tracking-[0.15em] mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Coming Soon — Next Gen Features
              </div>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-[1.1] tracking-tight deepshield-glow-text">
                The Future of
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500">
                  Threat Detection
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-lg text-slate-300 mb-10 max-w-xl leading-relaxed">
                We're building the next generation of AI-powered deepfake defense.
                Get early access to features that will redefine digital media security.
              </p>
            </Reveal>

            <Reveal delay={350}>
              <Countdown />
            </Reveal>

            <Reveal delay={500}>
              <p className="mt-4 text-[11px] text-slate-600 uppercase tracking-[0.15em]">Until next major release</p>
            </Reveal>
          </div>

          {/* Right — Radar */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full aspect-square max-w-[500px] mx-auto"
            >
              {/* Glow behind radar */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/8 via-blue-600/5 to-transparent blur-3xl scale-125" />

              <RadarScan className="relative z-10" />

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute top-[8%] right-[5%] flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-[#0a0f1a]/70 backdrop-blur-md text-[11px] text-amber-300 font-medium z-20"
              >
                <span className="material-symbols-outlined text-sm">warning</span>
                6 Threats Detected
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="absolute bottom-[12%] left-[2%] flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/20 bg-[#0a0f1a]/70 backdrop-blur-md text-[11px] text-emerald-300 font-medium z-20"
              >
                <span className="material-symbols-outlined text-sm">scan</span>
                Scanning Active
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Feature Preview Grid ═══ */}
      <section className="py-24 px-6 max-w-[1440px] mx-auto relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <span className="cyber-badge cyber-badge-glow mb-4 inline-flex">Roadmap Preview</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white deepshield-glow-text mb-4">
              What's Being <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Built Next</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A preview of the features currently in our development pipeline. Each card shows real-time progress status.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingFeatures.map((feature, idx) => (
            <FeaturePreviewCard key={feature.title} feature={feature} index={idx} />
          ))}
        </div>
      </section>

      {/* ═══ Early Access CTA ═══ */}
      <section className="py-24 px-6 border-t border-white/5 mesh-bg relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/15">
              <span className="material-symbols-outlined text-3xl text-cyan-400">notifications_active</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 deepshield-glow-text">
              Get Early <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Access</span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-slate-400 mb-8 text-lg">
              Be the first to test new detection capabilities. Join our early access program and help shape the future of media security.
            </p>
          </Reveal>

          <Reveal delay={350}>
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  required
                  className="cyber-input flex-1 text-center sm:text-left"
                />
                <button
                  type="submit"
                  className="deepshield-btn-primary inline-flex items-center justify-center gap-2 interactive whitespace-nowrap"
                >
                  <Send className="h-4 w-4" />
                  Join Waitlist
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">You're on the list! We'll notify you when features launch.</span>
              </motion.div>
            )}
          </Reveal>

          <Reveal delay={500}>
            <div className="mt-8 flex flex-wrap gap-6 justify-center text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-cyan-400/50">group</span>
                2,400+ on waitlist
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-cyan-400/50">lock</span>
                No spam, ever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-cyan-400/50">bolt</span>
                Priority access
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
