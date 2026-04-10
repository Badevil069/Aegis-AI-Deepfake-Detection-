import { motion } from 'framer-motion';
import { Cpu, ShieldCheck } from 'lucide-react';

function ScanRing({ size = 180, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.3, 0.8] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute rounded-full border border-brand-cyan/20"
      style={{ width: size, height: size }}
    />
  );
}

export default function Loader({ progress, statusText }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(99,102,241,0.1),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.08),transparent_45%)]" />

      {/* Grid background */}
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Central icon with rings */}
        <div className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center">
          <ScanRing size={160} delay={0} />
          <ScanRing size={120} delay={0.5} />
          <ScanRing size={80} delay={1} />

          {/* Rotating outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute h-36 w-36"
          >
            <svg viewBox="0 0 144 144" className="h-full w-full">
              <circle
                cx="72" cy="72" r="68"
                fill="none"
                stroke="url(#scanGradient)"
                strokeWidth="1.5"
                strokeDasharray="8 6"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Inner icon */}
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-indigo/15 shadow-neon-cyan">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldCheck className="h-8 w-8 text-brand-cyan" strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>

        {/* Text content */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-white">
            Processing <span className="glow-text">Detection</span>
          </h1>
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-sm text-slate-400 font-mono"
          >
            {statusText}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="mt-8 px-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/6">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.5 }}
              className="relative h-full rounded-full bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-violet"
              style={{ boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}
            >
              {/* Shimmer effect on progress bar */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </motion.div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-mono">
              <Cpu className="mr-1.5 inline h-3 w-3" />
              Neural scan in progress
            </span>
            <span className="font-mono text-brand-cyan">{progress}%</span>
          </div>
        </div>

        {/* Phase indicators */}
        <div className="mt-6 flex justify-center gap-1.5 px-4">
          {[0, 25, 50, 75, 100].map((threshold, idx) => (
            <div
              key={threshold}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                progress >= threshold
                  ? 'bg-gradient-to-r from-brand-cyan to-brand-indigo'
                  : 'bg-white/6'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
