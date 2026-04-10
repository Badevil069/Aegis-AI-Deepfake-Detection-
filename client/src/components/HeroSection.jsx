import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, ShieldAlert, Scan, Brain, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function FloatingParticle({ className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1, 0.5], y: [0, -40, -80] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute h-1 w-1 rounded-full ${className}`}
    />
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotateY: -8 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden w-full max-w-lg xl:block"
      style={{ perspective: '1200px' }}
    >
      <div className="glass-card-elevated relative overflow-hidden p-5">
        {/* Header bar */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <div className="ml-auto rounded-md bg-white/5 px-3 py-1 text-[10px] text-slate-500">aegis://sentinel.ai/dashboard</div>
        </div>

        {/* Mock stat cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Threats Blocked', value: '2,847', color: 'from-brand-cyan/20 to-brand-blue/10' },
            { label: 'Scans Today', value: '12.4K', color: 'from-brand-indigo/20 to-brand-violet/10' },
            { label: 'Accuracy', value: '99.2%', color: 'from-emerald-500/20 to-emerald-700/10' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-lg bg-gradient-to-br ${stat.color} border border-white/5 p-3`}>
              <p className="text-[9px] uppercase tracking-wider text-slate-500">{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Mock chart */}
        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Anomaly Detection Feed</span>
            <span className="pulse-dot" />
          </div>
          <div className="flex h-16 items-end gap-1">
            {[25, 45, 35, 60, 80, 55, 70, 45, 90, 65, 50, 75, 40, 85, 60, 70].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: 0.8 + idx * 0.05, duration: 0.4 }}
                className="flex-1 rounded-t bg-gradient-to-t from-brand-indigo/80 to-brand-cyan/60"
              />
            ))}
          </div>
        </div>

        {/* Scan line overlay */}
        <div className="scan-line pointer-events-none absolute inset-0 rounded-2xl" />
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.06]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/[0.07] via-brand-indigo/[0.05] to-brand-violet/[0.04]" />
      <div className="grid-bg absolute inset-0" />

      {/* Animated glow elements */}
      <div className="pointer-events-none absolute -left-32 -top-16 h-72 w-72 rounded-full bg-brand-cyan/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-brand-violet/20 blur-[80px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-indigo/10 blur-[60px]" />

      {/* Floating particles */}
      <FloatingParticle className="left-[15%] top-[30%] bg-brand-cyan" delay={0} />
      <FloatingParticle className="left-[25%] top-[60%] bg-brand-indigo" delay={1.2} />
      <FloatingParticle className="right-[20%] top-[25%] bg-brand-violet" delay={2.5} />
      <FloatingParticle className="right-[35%] bottom-[20%] bg-brand-cyan" delay={0.8} />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-12 px-8 py-20 md:px-12 md:py-24 xl:px-16">
        <div className="flex max-w-2xl flex-col items-start gap-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="cyber-badge cyber-badge-glow"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            AI Cybersecurity Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl"
          >
            Detect Deepfakes{' '}
            <span className="glow-text-animated">Instantly</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-xl text-base leading-relaxed text-slate-400 md:text-lg"
          >
            AI-powered verification for video, audio, and images. Protect investigations, moderation pipelines, and critical communications with multimodal deepfake detection.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="flex flex-wrap gap-3"
          >
            {[
              { icon: Scan, label: 'Real-time Analysis' },
              { icon: Brain, label: 'Neural Detection' },
              { icon: Fingerprint, label: 'Biometric Verification' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                <Icon className="h-3 w-3 text-brand-cyan/70" />
                {label}
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <button
              id="hero-upload-cta"
              className="cyber-button inline-flex items-center gap-2.5 px-6 py-3.5 text-sm"
              onClick={() => navigate('/detect')}
            >
              <span>Upload Media</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              id="hero-live-cta"
              className="ghost-button inline-flex items-center gap-2.5 px-6 py-3.5 text-sm"
              onClick={() => navigate('/live')}
            >
              <PlayCircle className="h-4 w-4" />
              <span>Start Live Detection</span>
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center gap-4 text-xs text-slate-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              99.99% Uptime
            </span>
            <span className="h-3 w-px bg-slate-700" />
            <span>SOC 2 Compliant</span>
            <span className="h-3 w-px bg-slate-700" />
            <span>1.8M+ Scans</span>
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <DashboardPreview />
      </div>
    </section>
  );
}
